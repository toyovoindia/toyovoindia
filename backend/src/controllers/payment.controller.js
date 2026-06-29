import Order from '../models/Order.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { successResponse } from '../utils/apiResponse.js';
import { buildOrderDraftFromCheckout, applyFulfilledOrderSideEffects } from '../services/order.service.js';
import { sendOrderConfirmationEmail } from '../services/email.service.js';
import { generateTxnId, generatePayuHash, verifyPayuHash } from '../utils/payu.js';
import { notifyPaymentSuccess, notifyPaymentFailed, notifyRefundProcessed } from '../services/notification.service.js';
import env from '../config/env.js';
import logger from '../utils/logger.js';

export const createPayuOrder = asyncHandler(async (req, res) => {
  const draft = await buildOrderDraftFromCheckout(req.body);
  const txnid = generateTxnId();

  // PayU requires productinfo, firstname, email, phone
  const productinfo = 'Toyovo_Order';
  const firstname = req.body.customer.firstName || 'Customer';
  const phone = req.body.customer.phone || '9999999999';
  const email = req.body.customer.email || 'dummy@toyovo.com';

  const { hash, formattedAmount, safeEmail } = generatePayuHash({
    txnid,
    amount: draft.totalAmount,
    productinfo,
    firstname,
    email,
    phone
  });

  // Pre-create pending order in MongoDB
  const order = await Order.create({
    user: req.user?._id || null,
    customer: {
      ...req.body.customer,
      email: email.toLowerCase(),
    },
    shippingAddress: req.body.shippingAddress,
    items: draft.items,
    status: 'pending',
    paymentStatus: 'pending',
    paymentMethod: 'payu',
    shippingMethod: req.body.shippingMethod,
    subtotal: draft.subtotal,
    shippingAmount: draft.shippingAmount,
    discountAmount: draft.discountAmount,
    totalAmount: draft.totalAmount,
    coupon: draft.couponData,
    notes: req.body.notes || undefined,
    paymentGateway: {
      provider: 'payu',
      payuTxnId: txnid,
      payuHash: hash,
    },
  });

  logger.info('Pending PayU order pre-created in MongoDB', {
    orderNumber: order.orderNumber,
    payuTxnId: txnid,
  });

  // Return data needed for the frontend to construct the PayU form
  return successResponse(res, 201, 'PayU order initiated successfully', {
    key: env.PAYU_KEY,
    txnid,
    amount: formattedAmount,
    productinfo,
    firstname,
    email: safeEmail,
    phone,
    surl: `${env.SERVER_URL}/api/payments/payu/success`,
    furl: `${env.SERVER_URL}/api/payments/payu/failure`,
    hash,
    payuBaseUrl: env.PAYU_BASE_URL,
    orderNumber: order.orderNumber,
  });
});

export const handlePayuSuccess = asyncHandler(async (req, res, next) => {
  logger.info('PayU success callback received', req.body);
  
  const isValid = verifyPayuHash(req.body);
  
  if (!isValid) {
    logger.error('PayU hash verification failed in success callback', { txnid: req.body.txnid });
    return res.redirect(`${env.CLIENT_URL}/checkout?error=HashMismatch`);
  }

  if (req.body.status !== 'success') {
    logger.error('PayU status is not success in success callback', { status: req.body.status });
    return res.redirect(`${env.CLIENT_URL}/checkout?error=PaymentFailed`);
  }

  const order = await Order.findOne({ 'paymentGateway.payuTxnId': req.body.txnid });
  
  if (!order) {
    logger.error('Associated pending order not found for PayU success verification', { txnid: req.body.txnid });
    return res.redirect(`${env.CLIENT_URL}/checkout?error=OrderNotFound`);
  }

  if (order.paymentStatus === 'paid') {
    // Already processed (could happen with webhook duplicate)
    return res.redirect(`${env.CLIENT_URL}/order-success?orderNumber=${order.orderNumber}`);
  }

  // Build draft to get resolved items for side effects
  const checkoutData = {
    customer: order.customer,
    shippingAddress: order.shippingAddress,
    items: order.items.map(item => ({ productId: item.product, quantity: item.quantity })),
    shippingMethod: order.shippingMethod,
    couponCode: order.coupon?.code || ''
  };
  const draft = await buildOrderDraftFromCheckout(checkoutData);

  // Update order
  order.status = 'processing';
  order.paymentStatus = 'paid';
  order.paymentGateway.payuMihpayid = req.body.mihpayid;
  order.paymentGateway.rawResponse = req.body;
  order.paymentGateway.verifiedAt = new Date();

  order.statusHistory.push({
    status: 'processing',
    note: 'Payment verified via PayU callback.',
    actorRole: 'system',
    createdAt: new Date(),
  });

  await applyFulfilledOrderSideEffects({
    resolvedItems: draft.resolvedItems,
    couponData: draft.couponData,
  });

  await order.save();

  Promise.resolve(notifyPaymentSuccess(order)).catch(() => {});

  logger.info('PayU payment success verification completed', { orderNumber: order.orderNumber, txnid: req.body.txnid });

  return res.redirect(`${env.CLIENT_URL}/order-success?orderNumber=${order.orderNumber}`);
});

export const handlePayuFailure = asyncHandler(async (req, res, next) => {
  logger.info('PayU failure callback received', req.body);
  
  // Even in failure, we can optionally verify the hash to ensure it's from PayU
  const isValid = verifyPayuHash(req.body);
  if (!isValid) {
    logger.warn('Invalid hash on PayU failure callback', { txnid: req.body.txnid });
  }

  const order = await Order.findOne({ 'paymentGateway.payuTxnId': req.body.txnid });
  
  if (order && order.paymentStatus !== 'paid') {
    order.paymentStatus = 'failed';
    order.status = 'cancelled';
    order.paymentGateway.payuMihpayid = req.body.mihpayid;
    order.paymentGateway.rawResponse = req.body;

    order.statusHistory.push({
      status: 'cancelled',
      note: 'Payment failed or cancelled on PayU gateway.',
      actorRole: 'system',
      createdAt: new Date(),
    });

    await order.save();
    Promise.resolve(notifyPaymentFailed(order)).catch(() => {});
  }

  return res.redirect(`${env.CLIENT_URL}/checkout?error=${req.body.error_Message || 'PaymentCancelled'}`);
});
