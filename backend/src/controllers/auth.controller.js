import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Order from '../models/Order.js';
import RefreshToken from '../models/RefreshToken.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { successResponse } from '../utils/apiResponse.js';
import { generateTokens, hashToken } from '../utils/jwt.js';
import { setAuthCookies, clearAuthCookies } from '../utils/cookies.js';
import { sendPasswordResetOtpEmail } from '../services/email.service.js'; // Keep as fallback if needed
import { notifyWelcome, notifySecurityLogin } from '../services/notification.service.js';
import logger from '../utils/logger.js';
import { sendOtpSms } from '../services/sms.service.js';

export const register = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, phone } = req.body;
  
  if (!phone || phone.trim() === '') {
    return next(new AppError('Mobile number is required for OTP verification.', 400));
  }

  logger.info('Auth register attempt', { email, phone, hasPassword: Boolean(password), ip: req.ip });

  const existingEmail = await User.findOne({ email: email.toLowerCase() });
  if (existingEmail && existingEmail.phoneVerified) {
    return next(new AppError('The email has already been verified by another account. Please enter another email.', 400));
  }

  const existingPhone = await User.findOne({ phone: phone.trim() });
  if (existingPhone && existingPhone.phoneVerified) {
    return next(new AppError('The mobile no has already been verified by another account. Please enter another mobile no.', 400));
  }

  // If unverified exists, we can overwrite or just delete it. We'll just delete unverified duplicates.
  if (existingEmail && !existingEmail.phoneVerified) await User.findByIdAndDelete(existingEmail._id);
  if (existingPhone && !existingPhone.phoneVerified) await User.findByIdAndDelete(existingPhone._id);

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const newUser = await User.create({
    firstName,
    lastName,
    email: email.toLowerCase(),
    phone: phone.trim(),
    passwordHash,
    phoneOtp: otp,
    phoneOtpExpires: Date.now() + 10 * 60 * 1000, // 10 mins
  });

  await Order.updateMany(
    { user: null, 'customer.email': newUser.email.toLowerCase() },
    { $set: { user: newUser._id } }
  );
  
  try {
    await sendOtpSms(newUser.phone, otp, 'register');
  } catch (err) {
    logger.error('Failed to send registration SMS', { error: err });
  }

  return successResponse(res, 201, 'Registration initiated. Please verify OTP sent to your mobile.', {
    requireOtp: true,
    phone: newUser.phone,
    purpose: 'register'
  });
});

export const login = asyncHandler(async (req, res, next) => {
  const { email, password, portal } = req.body; // email could be phone or email
  logger.info('Auth login attempt', { email, portal, hasPassword: Boolean(password), ip: req.ip });

  const isPhone = /^[6-9]\d{9}$/.test(email.trim());
  const phoneQuery = isPhone ? '+91' + email.trim() : email.trim();

  const user = await User.findOne({ 
    $or: [{ email: email.toLowerCase() }, { phone: phoneQuery }] 
  }).select('+passwordHash +phone +status +phoneVerified');

  if (!user) {
    if (portal === 'admin') {
      return next(new AppError('Invalid email or password. Please try again.', 401));
    } else {
      if (isPhone) {
        return next(new AppError('We cannot find an existing account for this mobile number, first create account', 404));
      } else {
        return next(new AppError('We cannot find an existing account with this email, first create account', 404));
      }
    }
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return next(new AppError('Incorrect password, please try again.', 401));
  }

  if (user.status !== 'Active') {
    return next(new AppError(`Account is ${user.status.toLowerCase()}. Please contact support.`, 403));
  }

  // Log in immediately (no OTP during login as requested)
  const { accessToken, refreshTokenPlain, refreshTokenHash } = generateTokens(user._id);

  await RefreshToken.createTokenRecord(user._id, refreshTokenHash, req);
  
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  await Order.updateMany(
    { user: null, 'customer.email': user.email.toLowerCase() },
    { $set: { user: user._id } }
  );

  setAuthCookies(res, accessToken, refreshTokenPlain);

  Promise.resolve(notifySecurityLogin(user)).catch(() => {});

  return successResponse(res, 200, 'Login successful.', {
    ...user.toJSON(),
    accessToken,
  });
});

export const refresh = asyncHandler(async (req, res, next) => {
  const incomingRefreshToken = req.cookies.refreshToken;
  logger.info('Auth refresh attempt', {
    hasRefreshToken: Boolean(incomingRefreshToken),
    ip: req.ip,
    origin: req.headers.origin,
    cookieNames: Object.keys(req.cookies || {})
  });

  if (!incomingRefreshToken) {
    logger.warn('Auth refresh failed: no refresh token provided', {
      ip: req.ip
    });
    return next(new AppError('No refresh token provided', 401));
  }

  const tokenHash = hashToken(incomingRefreshToken);
  const existingToken = await RefreshToken.findOne({ tokenHash }).populate('user');

  if (!existingToken) {
    logger.warn('Auth refresh failed: token not found', {
      ip: req.ip
    });
    clearAuthCookies(res);
    return next(new AppError('Invalid or expired refresh token', 401));
  }

  if (existingToken.revokedAt || existingToken.expiresAt < new Date()) {
    logger.warn('Auth refresh failed: token revoked or expired', {
      tokenId: existingToken._id,
      userId: existingToken.user?._id,
      revokedAt: existingToken.revokedAt,
      expiresAt: existingToken.expiresAt
    });
    await RefreshToken.updateMany({ familyId: existingToken.familyId }, { revokedAt: new Date() });
    clearAuthCookies(res);
    return next(new AppError('Token has been revoked or expired. Please log in again.', 401));
  }

  const user = existingToken.user;
  if (!user || user.status !== 'Active') {
    logger.warn('Auth refresh failed: inactive or missing user', {
      tokenId: existingToken._id,
      userId: user?._id,
      status: user?.status
    });
    clearAuthCookies(res);
    return next(new AppError('User is inactive or no longer exists', 401));
  }

  // Rotate token safely:
  // 1. Generate new tokens
  const { accessToken, refreshTokenPlain, refreshTokenHash } = generateTokens(user._id);
  
  // 2. Mark old token as revoked and replaced
  existingToken.revokedAt = new Date();
  existingToken.replacedByTokenHash = refreshTokenHash;
  await existingToken.save();

  // 3. Create the new token in the same family
  await RefreshToken.createTokenRecord(user._id, refreshTokenHash, req, existingToken.familyId);

  setAuthCookies(res, accessToken, refreshTokenPlain);
  logger.info('Auth refresh success', {
    userId: user._id,
    email: user.email,
    tokenFamilyId: existingToken.familyId,
    ip: req.ip
  });

  return successResponse(res, 200, 'Token refreshed successfully', {
    ...user.toJSON(),
    accessToken,
  });
});

export const logout = asyncHandler(async (req, res, next) => {
  const incomingRefreshToken = req.cookies.refreshToken;
  logger.info('Auth logout attempt', {
    hasRefreshToken: Boolean(incomingRefreshToken),
    ip: req.ip
  });
  
  if (incomingRefreshToken) {
    const tokenHash = hashToken(incomingRefreshToken);
    await RefreshToken.findOneAndUpdate({ tokenHash }, { revokedAt: new Date() });
  }

  clearAuthCookies(res);
  logger.info('Auth logout success', {
    ip: req.ip
  });
  return successResponse(res, 200, 'Logged out successfully');
});

export const getMe = asyncHandler(async (req, res, next) => {
  logger.info('Auth getMe success', {
    userId: req.user?._id,
    email: req.user?.email,
    role: req.user?.role,
    ip: req.ip
  });
  return successResponse(res, 200, 'Current user profile', req.user.toJSON());
});

export const forgotPassword = asyncHandler(async (req, res, next) => {
  const { phone } = req.body;
  if (!phone) {
    return next(new AppError('Please provide your registered mobile number', 400));
  }

  const isPhone = /^\d{10}$/.test(phone.trim());
  const phoneQuery = isPhone ? '+91' + phone.trim() : phone.trim();

  const user = await User.findOne({ phone: phoneQuery });
  if (!user) {
    // For security reasons, still say success
    return successResponse(res, 200, 'If an account exists with this number, you will receive an OTP.');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  user.phoneOtp = otp;
  user.phoneOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save({ validateBeforeSave: false });

  try {
    await sendOtpSms(user.phone, otp, 'reset');
    return successResponse(res, 200, 'Password reset OTP sent to your mobile number.', {
      requireOtp: true,
      phone: user.phone,
      purpose: 'reset'
    });
  } catch (error) {
    user.phoneOtp = undefined;
    user.phoneOtpExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('Error sending SMS. Please try again later.', 500));
  }
});

export const verifyOtp = asyncHandler(async (req, res, next) => {
  const { phone, otp, purpose, password } = req.body;
  if (!phone || !otp || !purpose) {
    return next(new AppError('Please provide phone, otp, and purpose', 400));
  }

  const isPhone = /^\d{10}$/.test(phone.trim());
  const phoneQuery = isPhone ? '+91' + phone.trim() : phone.trim();

  const user = await User.findOne({ 
    phone: phoneQuery,
    phoneOtp: otp,
    phoneOtpExpires: { $gt: Date.now() }
  }).select('+phoneOtp +phoneOtpExpires +status +role');

  if (!user) {
    return next(new AppError('Invalid or expired OTP', 400));
  }

  // Clear OTP
  user.phoneOtp = undefined;
  user.phoneOtpExpires = undefined;

  if (purpose === 'register') {
    user.phoneVerified = true;
    await user.save({ validateBeforeSave: false });
    Promise.resolve(notifyWelcome(user)).catch(() => {});
  } else if (purpose === 'reset') {
    if (!password) {
      return next(new AppError('Please provide new password', 400));
    }
    
    const userWithPassword = await User.findById(user._id).select('+passwordHash');
    if (userWithPassword.passwordHash && await userWithPassword.comparePassword(password)) {
      return next(new AppError('New password cannot be the same as your previous password. Please enter a different new password.', 400));
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);
    user.passwordChangedAt = Date.now();
    await user.save({ validateBeforeSave: false });
  } else if (purpose === 'login') {
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });
    Promise.resolve(notifySecurityLogin(user)).catch(() => {});
  } else {
    return next(new AppError('Invalid purpose', 400));
  }

  // Generate tokens and log them in
  const { accessToken, refreshTokenPlain, refreshTokenHash } = generateTokens(user._id);

  await RefreshToken.createTokenRecord(user._id, refreshTokenHash, req);
  await Order.updateMany(
    { user: null, 'customer.email': user.email.toLowerCase() },
    { $set: { user: user._id } }
  );

  setAuthCookies(res, accessToken, refreshTokenPlain);

  const msgMap = {
    'register': 'Registration successful. You are now logged in.',
    'login': 'Login successful.',
    'reset': 'Password reset successful. You are now logged in.'
  };

  return successResponse(res, 200, msgMap[purpose], {
    ...user.toJSON(),
    accessToken,
  });
});

export const resendOtp = asyncHandler(async (req, res, next) => {
  const { phone, purpose } = req.body;
  if (!phone || !purpose) {
    return next(new AppError('Please provide phone and purpose', 400));
  }

  const isPhone = /^\d{10}$/.test(phone.trim());
  const phoneQuery = isPhone ? '+91' + phone.trim() : phone.trim();

  const user = await User.findOne({ phone: phoneQuery });
  if (!user) {
    return next(new AppError('User with this mobile number does not exist.', 404));
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  user.phoneOtp = otp;
  user.phoneOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save({ validateBeforeSave: false });

  try {
    await sendOtpSms(user.phone, otp, purpose);
    return successResponse(res, 200, 'OTP resent successfully.', {
      phone: user.phone,
      purpose
    });
  } catch (error) {
    user.phoneOtp = undefined;
    user.phoneOtpExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('Error sending SMS. Please try again later.', 500));
  }
});
