import Order from '../models/Order.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { successResponse } from '../utils/apiResponse.js';
import { buildOrderDraftFromCheckout, applyFulfilledOrderSideEffects } from '../services/order.service.js';
import { sendOrderConfirmationEmail } from '../services/email.service.js';
import { getRazorpayClient, verifyRazorpayPaymentSignature, verifyRazorpayWebhookSignature } from '../utils/razorpay.js';
import { notifyPaymentSuccess, notifyPaymentFailed, notifyRefundProcessed } from '../services/notification.service.js';
import env from '../config/env.js';
import logger from '../utils/logger.js';

const toPaise = (value) => Math.round(Number(value) * 100);

export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const draft = await buildOrderDraftFromCheckout(req.body);
  const razorpay = getRazorpayClient();
  logger.info('Razorpay order creation requested', {
    email: req.body?.customer?.email,
    shippingMethod: req.body?.shippingMethod,
    itemCount: req.body?.items?.length || 0,
    totalAmount: draft.totalAmount,
  });

  const razorpayOrder = await razorpay.orders.create({
    amount: toPaise(draft.totalAmount),
    currency: 'INR',
    receipt: `toyovo_${Date.now()}`,
    notes: {
      email: req.body.customer.email,
      shippingMethod: req.body.shippingMethod,
      paymentSource: 'toyovo_web_checkout',
    },
  });

  // Pre-create pending order in MongoDB
  const order = await Order.create({
    user: req.user?._id || null,
    customer: {
      ...req.body.customer,
      email: req.body.customer.email.toLowerCase(),
    },
    shippingAddress: req.body.shippingAddress,
    items: draft.items,
    status: 'pending',
    paymentStatus: 'pending',
    paymentMethod: 'razorpay',
    shippingMethod: req.body.shippingMethod,
    subtotal: draft.subtotal,
    shippingAmount: draft.shippingAmount,
    discountAmount: draft.discountAmount,
    totalAmount: draft.totalAmount,
    coupon: draft.couponData,
    notes: req.body.notes || undefined,
    paymentGateway: {
      provider: 'razorpay',
      razorpayOrderId: razorpayOrder.id,
    },
  });

  logger.info('Pending order pre-created in MongoDB', {
    orderNumber: order.orderNumber,
    razorpayOrderId: razorpayOrder.id,
  });

  return successResponse(res, 201, 'Razorpay order created successfully', {
    razorpayOrderId: razorpayOrder.id,
    amount: draft.totalAmount,
    amountInPaise: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: env.RAZORPAY_KEY_ID,
    breakdown: {
      subtotal: draft.subtotal,
      shipping: draft.shippingAmount,
      discount: draft.discountAmount,
      total: draft.totalAmount,
    },
  });
});

export const verifyRazorpayPayment = asyncHandler(async (req, res, next) => {
  logger.info('Razorpay payment verification requested', {
    razorpayOrderId: req.body.razorpayOrderId,
    razorpayPaymentId: req.body.razorpayPaymentId,
    email: req.body?.checkoutData?.customer?.email,
  });
  const isValidSignature = verifyRazorpayPaymentSignature({
    orderId: req.body.razorpayOrderId,
    paymentId: req.body.razorpayPaymentId,
    signature: req.body.razorpaySignature,
  });

  if (!isValidSignature) {
    logger.warn('Razorpay payment verification failed: signature mismatch', {
      razorpayOrderId: req.body.razorpayOrderId,
      razorpayPaymentId: req.body.razorpayPaymentId,
    });
    return next(new AppError('Payment verification failed. Signature mismatch.', 400));
  }

  // Find the pending order by razorpayOrderId
  const order = await Order.findOne({ 'paymentGateway.razorpayOrderId': req.body.razorpayOrderId });
  if (!order) {
    logger.warn('Associated pending order not found for verification', {
      razorpayOrderId: req.body.razorpayOrderId,
    });
    return next(new AppError('Associated order not found', 404));
  }

  if (order.paymentStatus === 'paid') {
    return successResponse(res, 200, 'Payment already verified', order);
  }

  const draft = await buildOrderDraftFromCheckout(req.body.checkoutData);
  logger.info('Razorpay payment verification draft prepared', {
    razorpayOrderId: req.body.razorpayOrderId,
    razorpayPaymentId: req.body.razorpayPaymentId,
    totalAmount: draft.totalAmount,
    itemCount: draft.items.length,
  });

  // Update order status to paid & processing
  order.status = 'processing';
  order.paymentStatus = 'paid';
  order.paymentGateway.razorpayPaymentId = req.body.razorpayPaymentId;
  order.paymentGateway.razorpaySignature = req.body.razorpaySignature;
  order.paymentGateway.paymentMethodLabel = req.body.paymentMethodLabel || undefined;
  order.paymentGateway.verifiedAt = new Date();

  // Add timeline entry
  order.statusHistory.push({
    status: 'processing',
    note: 'Payment verified and order confirmed.',
    actorRole: 'system',
    createdAt: new Date(),
  });

  await applyFulfilledOrderSideEffects({
    resolvedItems: draft.resolvedItems,
    couponData: draft.couponData,
  });

  await order.save();

  Promise.resolve(sendOrderConfirmationEmail(order)).catch((error) => {
    logger.warn(`Order confirmation email failed for ${order.orderNumber}: ${error.message}`);
  });

  // Push notification
  Promise.resolve(notifyPaymentSuccess(order)).catch(() => {});

  logger.info('Razorpay payment verification success', {
    orderNumber: order.orderNumber,
    razorpayOrderId: req.body.razorpayOrderId,
    razorpayPaymentId: req.body.razorpayPaymentId,
  });

  return successResponse(res, 201, 'Payment verified and order placed successfully', order);
});

export const handleRazorpayWebhook = asyncHandler(async (req, res, next) => {
  const signature = req.headers['x-razorpay-signature'];
  const payload = req.rawBody;

  if (!signature || !payload) {
    return next(new AppError('Invalid Razorpay webhook request', 400));
  }

  const isValid = verifyRazorpayWebhookSignature({
    payload,
    signature,
  });

  if (!isValid) {
    return next(new AppError('Invalid Razorpay webhook signature', 400));
  }

  const event = req.body.event;
  const paymentEntity = req.body.payload?.payment?.entity;
  const refundEntity = req.body.payload?.refund?.entity;

  if (paymentEntity?.id) {
    // Try finding by paymentId first, otherwise fallback to pre-created order via order_id
    let order = await Order.findOne({ 'paymentGateway.razorpayPaymentId': paymentEntity.id });
    if (!order && paymentEntity.order_id) {
      order = await Order.findOne({ 'paymentGateway.razorpayOrderId': paymentEntity.order_id });
    }

    if (order) {
      order.paymentGateway = {
        ...order.paymentGateway,
        lastWebhookEvent: event,
        lastWebhookAt: new Date(),
      };

      if (event === 'payment.captured' && order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid';
        order.status = 'processing';
        order.paymentGateway.razorpayPaymentId = paymentEntity.id;
        order.paymentGateway.verifiedAt = new Date();

        order.statusHistory.push({
          status: 'processing',
          note: 'Payment captured via Webhook fallback.',
          actorRole: 'system',
          createdAt: new Date(),
        });

        // Apply side effects
        const checkoutData = {
          customer: order.customer,
          shippingAddress: order.shippingAddress,
          items: order.items.map(item => ({
            productId: item.product,
            quantity: item.quantity
          })),
          shippingMethod: order.shippingMethod,
          couponCode: order.coupon?.code || ''
        };

        const draft = await buildOrderDraftFromCheckout(checkoutData);
        await applyFulfilledOrderSideEffects({
          resolvedItems: draft.resolvedItems,
          couponData: draft.couponData,
        });

        Promise.resolve(sendOrderConfirmationEmail(order)).catch((error) => {
          logger.warn(`Order confirmation email failed for ${order.orderNumber}: ${error.message}`);
        });

        Promise.resolve(notifyPaymentSuccess(order)).catch(() => {});
      }

      if (event === 'payment.failed' && order.paymentStatus !== 'paid') {
        order.paymentStatus = 'failed';
        order.status = 'cancelled';
        order.paymentGateway.razorpayPaymentId = paymentEntity.id;

        order.statusHistory.push({
          status: 'cancelled',
          note: 'Payment failed on gateway.',
          actorRole: 'system',
          createdAt: new Date(),
        });

        Promise.resolve(notifyPaymentFailed(order)).catch(() => {});
      }

      await order.save();
    }
  }

  if (refundEntity?.payment_id) {
    const order = await Order.findOne({ 'paymentGateway.razorpayPaymentId': refundEntity.payment_id });
    if (order) {
      order.paymentStatus = 'refunded';
      order.paymentGateway = {
        ...order.paymentGateway,
        lastWebhookEvent: event,
        lastWebhookAt: new Date(),
      };
      await order.save();
      Promise.resolve(notifyRefundProcessed(order)).catch(() => {});
    }
  }

  return successResponse(res, 200, 'Webhook received successfully', { received: true });
});
