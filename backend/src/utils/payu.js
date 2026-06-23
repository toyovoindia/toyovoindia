import crypto from 'crypto';
import env from '../config/env.js';
import AppError from './AppError.js';

/**
 * Generates a transaction ID for PayU
 */
export const generateTxnId = () => {
  return `TYV_${Date.now()}${Math.floor(Math.random() * 1000)}`;
};

/**
 * Generates the PayU request hash
 * Hash Format: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|udf6|udf7|udf8|udf9|udf10|salt
 */
export const generatePayuHash = ({ txnid, amount, productinfo, firstname, email, phone }) => {
  if (!env.PAYU_KEY || !env.PAYU_SALT) {
    throw new AppError('PayU is not configured properly in .env', 500);
  }

  // PayU recommends 2 decimal places for amount
  const formattedAmount = Number(amount).toFixed(2);
  // We use a dummy email if none is provided, to satisfy PayU's requirement
  const safeEmail = email || 'dummy@toyovo.com';

  const hashString = `${env.PAYU_KEY}|${txnid}|${formattedAmount}|${productinfo}|${firstname}|${safeEmail}|||||||||||${env.PAYU_SALT}`;
  
  const hash = crypto.createHash('sha512').update(hashString).digest('hex');
  return { hash, formattedAmount, safeEmail };
};

/**
 * Verifies the PayU response hash (Callback/Webhook)
 * Reverse Hash Format: salt|status|||||||||||email|firstname|productinfo|amount|txnid|key
 */
export const verifyPayuHash = (payuResponse) => {
  if (!env.PAYU_KEY || !env.PAYU_SALT) {
    throw new AppError('PayU is not configured properly in .env', 500);
  }

  const {
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    status,
    hash: receivedHash,
    additionalCharges
  } = payuResponse;

  let hashString = '';

  // If additionalCharges is present, PayU appends it at the start of the reverse hash
  if (additionalCharges) {
    hashString = `${additionalCharges}|${env.PAYU_SALT}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${env.PAYU_KEY}`;
  } else {
    hashString = `${env.PAYU_SALT}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${env.PAYU_KEY}`;
  }

  const calculatedHash = crypto.createHash('sha512').update(hashString).digest('hex');

  return calculatedHash === receivedHash;
};
