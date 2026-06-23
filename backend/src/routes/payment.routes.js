import express from 'express';
import { createPayuOrder, handlePayuSuccess, handlePayuFailure } from '../controllers/payment.controller.js';
import { optionalAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createPayuOrderSchema } from '../validators/payment.validator.js';

const router = express.Router();

router.post('/payu/order', optionalAuth, validate(createPayuOrderSchema), createPayuOrder);
router.post('/payu/success', handlePayuSuccess);
router.post('/payu/failure', handlePayuFailure);

export default router;
