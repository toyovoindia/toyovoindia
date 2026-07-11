import express from 'express';
import { createPayuOrder, handlePayuSuccess, handlePayuFailure, createPhonepeOrder, handlePhonepeWebhook, checkPhonepeStatus } from '../controllers/payment.controller.js';
import { optionalAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createPayuOrderSchema } from '../validators/payment.validator.js';

const router = express.Router();

router.post('/payu/order', optionalAuth, validate(createPayuOrderSchema), createPayuOrder);
router.post('/payu/success', handlePayuSuccess);
router.post('/payu/failure', handlePayuFailure);

router.post('/phonepe/initiate', optionalAuth, validate(createPayuOrderSchema), createPhonepeOrder);
router.post('/phonepe/webhook', handlePhonepeWebhook);
router.get('/phonepe/status/:txnid', checkPhonepeStatus);

export default router;
