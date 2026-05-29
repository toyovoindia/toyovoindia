import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { successResponse } from '../utils/apiResponse.js';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import bcrypt from 'bcryptjs';
import { generateTokens } from '../utils/jwt.js';
import { setAuthCookies } from '../utils/cookies.js';
import Order from '../models/Order.js';

export const getMe = asyncHandler(async (req, res, next) => {
  return successResponse(res, 200, 'Current user profile', req.user.toJSON());
});

const normalizePreferenceItems = (value) => {
  if (!Array.isArray(value)) return [];
  return value.filter(Boolean);
};

const normalizeAddresses = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .filter(Boolean)
    .map((item, index) => ({
      id: String(item.id || Date.now() + index),
      type: item.type || 'Home',
      firstName: item.firstName || '',
      lastName: item.lastName || '',
      address: item.address || '',
      apartment: item.apartment || '',
      city: item.city || '',
      district: item.district || '',
      state: item.state || '',
      postalCode: item.postalCode || '',
      phone: item.phone || '',
      isDefault: Boolean(item.isDefault),
    }))
    .map((item, _, arr) => ({ ...item, isDefault: arr.some((candidate) => candidate.isDefault) ? item.isDefault : item === arr[0] }));
};

const normalizePaymentVault = (value) => ({
  bankAccounts: Array.isArray(value?.bankAccounts) ? value.bankAccounts.filter(Boolean) : [],
  upiIds: Array.isArray(value?.upiIds) ? value.upiIds.filter(Boolean) : [],
  cards: Array.isArray(value?.cards) ? value.cards.filter(Boolean) : [],
});

const normalizePaymentHistory = (value) => Array.isArray(value) ? value.filter(Boolean) : [];

export const getMyPreferences = asyncHandler(async (req, res) => {
  return successResponse(res, 200, 'User preferences fetched successfully', {
    cart: normalizePreferenceItems(req.user.preferences?.cart),
    wishlist: normalizePreferenceItems(req.user.preferences?.wishlist),
    compare: normalizePreferenceItems(req.user.preferences?.compare),
  });
});

export const getMyAccountData = asyncHandler(async (req, res) => {
  return successResponse(res, 200, 'User account data fetched successfully', {
    addresses: normalizeAddresses(req.user.addresses),
    paymentVault: normalizePaymentVault(req.user.paymentVault),
    paymentHistory: normalizePaymentHistory(req.user.paymentHistory),
  });
});

export const updateMyAccountData = asyncHandler(async (req, res, next) => {
  try {
    const nextData = {};
    if (req.body.addresses !== undefined) {
      nextData.addresses = normalizeAddresses(req.body.addresses);
    }
    if (req.body.paymentVault !== undefined) {
      nextData.paymentVault = normalizePaymentVault(req.body.paymentVault);
    }
    if (req.body.paymentHistory !== undefined) {
      nextData.paymentHistory = normalizePaymentHistory(req.body.paymentHistory);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: nextData },
      { new: true }
    );

    return successResponse(res, 200, 'User account data updated successfully', {
      addresses: normalizeAddresses(updatedUser.addresses),
      paymentVault: normalizePaymentVault(updatedUser.paymentVault),
      paymentHistory: normalizePaymentHistory(updatedUser.paymentHistory),
    });
  } catch (error) {
    console.error('CRITICAL DB SAVE ERROR in updateMyAccountData:', error);
    return next(new AppError('Failed to update account data', 500));
  }
});

export const updateMyPreferences = asyncHandler(async (req, res) => {
  const nextPreferences = {
    cart: req.body.cart !== undefined ? normalizePreferenceItems(req.body.cart) : normalizePreferenceItems(req.user.preferences?.cart),
    wishlist: req.body.wishlist !== undefined ? normalizePreferenceItems(req.body.wishlist) : normalizePreferenceItems(req.user.preferences?.wishlist),
    compare: req.body.compare !== undefined ? normalizePreferenceItems(req.body.compare) : normalizePreferenceItems(req.user.preferences?.compare),
  };

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { preferences: nextPreferences },
    { new: true }
  );

  return successResponse(res, 200, 'User preferences updated successfully', {
    cart: normalizePreferenceItems(updatedUser.preferences?.cart),
    wishlist: normalizePreferenceItems(updatedUser.preferences?.wishlist),
    compare: normalizePreferenceItems(updatedUser.preferences?.compare),
  });
});

export const updateMe = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, phone } = req.body;

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(phone !== undefined && { phone }),
    },
    { new: true, runValidators: true }
  );

  return successResponse(res, 200, 'Profile updated successfully', updatedUser.toJSON());
});

export const updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+passwordHash');

  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(newPassword, salt);
  // Subtract 1 second from now to prevent race conditions with newly issued JWT's iat
  user.passwordChangedAt = new Date(Date.now() - 1000);
  
  await user.save();

  // Revoke all existing refresh tokens for this user
  await RefreshToken.updateMany(
    { user: user._id, revokedAt: { $exists: false } },
    { revokedAt: new Date() }
  );

  // Issue fresh tokens
  const { accessToken, refreshTokenPlain, refreshTokenHash } = generateTokens(user._id);

  // Utilize the schema static helper
  await RefreshToken.createTokenRecord(user._id, refreshTokenHash, req);

  setAuthCookies(res, accessToken, refreshTokenPlain);

  return successResponse(res, 200, 'Password updated successfully');
});

const adminSortMap = {
  recent: { createdAt: -1 },
  oldest: { createdAt: 1 },
  name: { firstName: 1, lastName: 1 },
  email: { email: 1 },
};

export const adminListUsers = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 10), 10000);
  const skip = (page - 1) * limit;
  const filter = {};

  if (req.query.status) filter.status = req.query.status;
  if (req.query.role) filter.role = req.query.role;
  if (req.query.search) {
    filter.$or = [
      { firstName: new RegExp(req.query.search, 'i') },
      { lastName: new RegExp(req.query.search, 'i') },
      { email: new RegExp(req.query.search, 'i') },
      { phone: new RegExp(req.query.search, 'i') },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort(adminSortMap[req.query.sort || 'recent'] || adminSortMap.recent)
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return successResponse(res, 200, 'Admin users fetched successfully', users, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

export const adminGetUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  const recentOrders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(5);

  return successResponse(res, 200, 'Admin user details', {
    ...user.toObject(),
    addresses: normalizeAddresses(user.addresses),
    paymentVault: normalizePaymentVault(user.paymentVault),
    paymentHistory: normalizePaymentHistory(user.paymentHistory),
    recentOrders: recentOrders.map((order) => ({
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      total: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt,
    })),
  });
});

export const adminCreateUser = asyncHandler(async (req, res, next) => {
  const existingUser = await User.findOne({ email: req.body.email });
  if (existingUser) {
    return next(new AppError('Email is already registered', 400));
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(req.body.password, salt);

  const user = await User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    passwordHash,
    phone: req.body.phone || '',
    role: req.body.role || 'customer',
    status: req.body.status || 'Active',
    emailVerified: true,
  });

  return successResponse(res, 201, 'User created successfully', user);
});

export const adminUpdateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (req.body.email && req.body.email !== user.email) {
    const existingUser = await User.findOne({ email: req.body.email, _id: { $ne: req.params.id } });
    if (existingUser) {
      return next(new AppError('Email is already registered', 400));
    }
  }

  Object.assign(user, {
    ...(req.body.firstName !== undefined && { firstName: req.body.firstName }),
    ...(req.body.lastName !== undefined && { lastName: req.body.lastName }),
    ...(req.body.email !== undefined && { email: req.body.email }),
    ...(req.body.phone !== undefined && { phone: req.body.phone }),
    ...(req.body.role !== undefined && { role: req.body.role }),
    ...(req.body.status !== undefined && { status: req.body.status }),
  });

  await user.save();

  return successResponse(res, 200, 'User updated successfully', user);
});

export const adminUpdateUserStatus = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  user.status = req.body.status;
  await user.save();

  return successResponse(res, 200, 'User status updated successfully', user);
});

export const saveFcmToken = asyncHandler(async (req, res, next) => {
  const { token, platform } = req.body;
  if (!token) {
    return next(new AppError('Token is required', 400));
  }

  // 1. Remove this token from ALL users (to prevent cross-user broadcasting if device changes hands)
  await User.updateMany(
    { $or: [{ fcmTokens: token }, { fcmTokenMobile: token }] },
    { $pull: { fcmTokens: token, fcmTokenMobile: token } }
  );

  // 2. Overwrite current user's tokens to ONLY be this single token (Single Device Rule)
  const updateData = {};
  if (platform === 'mobile') {
    updateData.fcmTokenMobile = [token];
    updateData.fcmTokens = []; // Clear web tokens
  } else {
    updateData.fcmTokens = [token];
    updateData.fcmTokenMobile = []; // Clear mobile tokens
  }

  await User.findByIdAndUpdate(req.user._id, { $set: updateData });

  return successResponse(res, 200, 'FCM token saved successfully (Limited to latest device)');
});

export const removeFcmToken = asyncHandler(async (req, res, next) => {
  const { token } = req.body;
  if (!token) {
    return next(new AppError('Token is required', 400));
  }

  await User.findByIdAndUpdate(req.user._id, {
    $pull: { 
      fcmTokens: token,
      fcmTokenMobile: token
    }
  });

  return successResponse(res, 200, 'FCM token removed successfully');
});

import { sendNotificationToUser, notifyAdmins } from '../services/notification.service.js';

export const sendTestPushNotification = asyncHandler(async (req, res, next) => {
  await sendNotificationToUser(req.user._id, {
    title: '🎉 Toyovo India',
    body: 'FCM Push Notifications are working perfectly!',
    category: 'General',
    userActionUrl: '/account',
    data: { type: 'test_notification' }
  });

  // Also send to admins so the user can verify admin push is working
  await notifyAdmins({
    title: '🛠️ Test Push Received',
    body: `User ${req.user.firstName} just fired a test notification.`,
    category: 'General',
    adminActionUrl: '/admin',
    data: { type: 'admin_test_notification' }
  });
  
  return successResponse(res, 200, 'Test push notification sent successfully');
});
