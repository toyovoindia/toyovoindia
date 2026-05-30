import express from 'express';
import { register, login, refresh, logout, getMe, forgotPassword, verifyOtp, resendOtp } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import { authLimiter, refreshLimiter } from '../middlewares/rateLimiter.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/resend-otp', authLimiter, resendOtp);
router.post('/refresh', refreshLimiter, refresh);
router.post('/logout', logout);

// Can be protected via auth middleware
router.get('/me', protect, getMe);

export default router;
