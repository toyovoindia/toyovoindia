import { getMessaging } from '../config/firebase.js';
import NotificationLog from '../models/NotificationLog.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

/**
 * Core FCM send helper — sends to a list of tokens and logs to DB.
 */
const _sendFCM = async ({ userId, notificationId, title, body, data, category, adminActionUrl, userActionUrl, orderNumber }) => {
  try {
    const messaging = getMessaging();

    // Duplicate prevention
    const exists = await NotificationLog.findOne({ notificationId });
    if (exists) {
      logger.info(`Duplicate notification blocked: ${notificationId}`);
      return;
    }

    let allTokens = [];
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        allTokens = [...new Set([...(user.fcmTokens || []), ...(user.fcmTokenMobile || [])])].filter(Boolean);
      }
    }

    // Always store in DB (even if no tokens — admin needs the log)
    const logEntry = {
      notificationId,
      userId: userId || undefined,
      title,
      body,
      data,
      tokens: allTokens,
      status: 'skipped',
      category: category || 'General',
      adminActionUrl,
      userActionUrl,
      orderNumber,
    };

    if (messaging && allTokens.length > 0) {
      const message = {
        notification: { title, body },
        data: {
          ...(data || {}),
          notificationId,
          click_action: userActionUrl || '/account',
        },
        tokens: allTokens,
      };

      const response = await messaging.sendEachForMulticast(message);
      logger.info(`FCM: ${response.successCount} sent, ${response.failureCount} failed — ${notificationId}`);
      logEntry.status = response.successCount > 0 ? 'sent' : 'failed';

      // Cleanup invalid tokens
      if (response.failureCount > 0 && userId) {
        const invalidTokens = [];
        response.responses.forEach((res, i) => {
          if (!res.success && ['messaging/invalid-registration-token', 'messaging/registration-token-not-registered'].includes(res.error?.code)) {
            invalidTokens.push(allTokens[i]);
          }
        });
        if (invalidTokens.length > 0) {
          await User.findByIdAndUpdate(userId, {
            $pull: { fcmTokens: { $in: invalidTokens }, fcmTokenMobile: { $in: invalidTokens } }
          });
        }
      }
    } else if (!messaging) {
      logger.warn('FCM not initialized — logging notification without push delivery.');
      logEntry.status = 'skipped';
    }

    await NotificationLog.create(logEntry);
  } catch (error) {
    if (error.code !== 11000) { // ignore duplicate key
      logger.error('Error sending push notification', error);
    }
  }
};

/**
 * Send push notification to a specific user.
 */
export const sendNotificationToUser = async (userId, payload) => {
  const type = payload.data?.type || 'general';
  const refId = payload.data?.id || Date.now();
  const notificationId = `${userId}_${type}_${refId}`;

  return _sendFCM({
    userId,
    notificationId,
    title: payload.title,
    body: payload.body,
    data: payload.data,
    category: payload.category || 'General',
    adminActionUrl: payload.adminActionUrl,
    userActionUrl: payload.userActionUrl,
    orderNumber: payload.orderNumber,
  });
};

// ─────────────────────────────────────────────
// Convenience helpers per event type
// ─────────────────────────────────────────────

export const notifyOrderPlaced = (order) => {
  if (order.user) {
    sendNotificationToUser(order.user, {
      title: '🎉 Order Placed!',
      body: `Your order #${order.orderNumber} is confirmed. Total: ₹${order.totalAmount}`,
      category: 'Order',
      orderNumber: order.orderNumber,
      adminActionUrl: `/admin/orders/${order._id}`,
      userActionUrl: '/account',
      data: { type: 'order_placed', id: order._id.toString(), orderNumber: order.orderNumber },
    }).catch(() => {});
  }

  // Also notify admins (works even for guest orders)
  return notifyAdmins({
    title: '🛒 New Order Received',
    body: `${order.customer.firstName} placed order #${order.orderNumber} for ₹${order.totalAmount}`,
    category: 'Order',
    orderNumber: order.orderNumber,
    adminActionUrl: `/admin/orders/${order._id}`,
    data: { type: 'admin_order_placed', id: order._id.toString(), orderNumber: order.orderNumber },
  });
};

export const notifyOrderStatusChanged = (order, previousStatus) => {
  if (!order.user) return;

  // Bug 113: Derive secret/delivery-verification code from order number (last segment after '-')
  const secretCode = order.orderNumber ? order.orderNumber.split('-').pop() : '';

  const messages = {
    processing: { title: '📦 Order Processing', body: `Your order #${order.orderNumber} is being processed.` },
    shipped:    {
      title: '🚚 Order Shipped!',
      body: `#${order.orderNumber} is on the way${order.trackingNumber ? `. Tracking: ${order.trackingNumber}` : ''}. Your delivery code: ${secretCode} — share only with your delivery agent.`
    },
    delivered:  { title: '🎉 Order Delivered!', body: `#${order.orderNumber} has been delivered. Enjoy!` },
    cancelled:  { title: '❌ Order Cancelled', body: `Your order #${order.orderNumber} has been cancelled.` },
  };
  const msg = messages[order.status];
  if (!msg) return;

  sendNotificationToUser(order.user, {
    ...msg,
    category: 'Order',
    orderNumber: order.orderNumber,
    adminActionUrl: `/admin/orders/${order._id}`,
    userActionUrl: '/account',
    data: { type: `order_${order.status}`, id: order._id.toString(), orderNumber: order.orderNumber, previousStatus },
  }).catch(() => {});

  // Also notify admins
  return notifyAdmins({
    ...msg,
    title: `📦 Order ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`,
    body: `Order #${order.orderNumber} status changed to ${order.status}`,
    category: 'Order',
    orderNumber: order.orderNumber,
    adminActionUrl: `/admin/orders/${order._id}`,
    data: { type: `admin_order_${order.status}`, id: order._id.toString(), orderNumber: order.orderNumber },
  });
};

export const notifyDeliveryRescheduled = (order, reason) => {
  if (!order.user) return;
  return sendNotificationToUser(order.user, {
    title: '📅 Delivery Rescheduled',
    body: `Your order #${order.orderNumber} delivery date has changed. Reason: ${reason}`,
    category: 'Order',
    orderNumber: order.orderNumber,
    adminActionUrl: `/admin/orders/${order._id}`,
    userActionUrl: '/account',
    data: { type: 'delivery_rescheduled', id: order._id.toString(), orderNumber: order.orderNumber },
  });
};

export const notifyOrderCancelled = (order) => {
  if (!order.user) return;
  if (order.user) {
    sendNotificationToUser(order.user, {
      title: '❌ Order Cancelled',
      body: `Your order #${order.orderNumber} has been cancelled. Refund will be processed soon.`,
      category: 'Order',
      orderNumber: order.orderNumber,
      adminActionUrl: `/admin/orders/${order._id}`,
      userActionUrl: '/account',
      data: { type: 'order_cancelled', id: order._id.toString(), orderNumber: order.orderNumber },
    }).catch(() => {});
  }

  // Also notify admins
  return notifyAdmins({
    title: '❌ Order Cancelled',
    body: `Order #${order.orderNumber} was cancelled.`,
    category: 'Order',
    orderNumber: order.orderNumber,
    adminActionUrl: `/admin/orders/${order._id}`,
    data: { type: 'admin_order_cancelled', id: order._id.toString(), orderNumber: order.orderNumber },
  });
};

export const notifyReturnRequested = (order) => {
  if (order.user) {
    sendNotificationToUser(order.user, {
      title: '🔄 Return Request Submitted',
      body: `Your return request for #${order.orderNumber} is under review.`,
      category: 'Return',
      orderNumber: order.orderNumber,
      adminActionUrl: `/admin/orders/${order._id}`,
      userActionUrl: '/account',
      data: { type: 'return_requested', id: order._id.toString(), orderNumber: order.orderNumber },
    }).catch(() => {});
  }

  // Also notify admins
  return notifyAdmins({
    title: '🔄 Return Requested',
    body: `${order.customer.firstName} requested a return for order #${order.orderNumber}`,
    category: 'Return',
    orderNumber: order.orderNumber,
    adminActionUrl: `/admin/orders/${order._id}`,
    data: { type: 'admin_return_requested', id: order._id.toString(), orderNumber: order.orderNumber },
  });
};

export const notifyReturnStatusChanged = (order) => {
  if (!order.user) return;
  const status = order.returnRequest?.status;
  const messages = {
    approved: { title: '✅ Return Approved', body: `Your return for #${order.orderNumber} has been approved. Refund is being processed.` },
    rejected: { title: '⛔ Return Declined', body: `Your return request for #${order.orderNumber} was declined. ${order.returnRequest?.adminNote || ''}` },
    refunded: { title: '💰 Refund Successful!', body: `Your refund for #${order.orderNumber} has been credited.` },
  };
  const msg = messages[status];
  if (!msg) return;

  return sendNotificationToUser(order.user, {
    ...msg,
    category: 'Return',
    orderNumber: order.orderNumber,
    adminActionUrl: `/admin/orders/${order._id}`,
    userActionUrl: '/account',
    data: { type: `return_${status}`, id: order._id.toString(), orderNumber: order.orderNumber },
  });
};

export const notifyPaymentSuccess = (order) => {
  if (order.user) {
    sendNotificationToUser(order.user, {
      title: '🎊 Order Confirmed!',
      body: `Payment Successful! Your order #${order.orderNumber} is now being processed.`,
      category: 'Payment',
      orderNumber: order.orderNumber,
      adminActionUrl: `/admin/orders/${order._id}`,
      userActionUrl: '/account',
      data: { type: 'payment_success', id: order._id.toString(), orderNumber: order.orderNumber },
    }).catch(() => {});
  }

  // Also notify admins
  return notifyAdmins({
    title: '💰 Payment Received',
    body: `Payment successful for order #${order.orderNumber} (₹${order.totalAmount})`,
    category: 'Payment',
    orderNumber: order.orderNumber,
    adminActionUrl: `/admin/orders/${order._id}`,
    data: { type: 'admin_payment_success', id: order._id.toString(), orderNumber: order.orderNumber },
  });
};

export const notifyPaymentFailed = (order) => {
  if (order.user) {
    sendNotificationToUser(order.user, {
      title: '❌ Payment Failed',
      body: `Your payment for order #${order.orderNumber} failed. Please retry.`,
      category: 'Payment',
      orderNumber: order.orderNumber,
      adminActionUrl: `/admin/orders/${order._id}`,
      userActionUrl: '/checkout',
      data: { type: 'payment_failed', id: order._id.toString(), orderNumber: order.orderNumber },
    }).catch(() => {});
  }

  // Also notify admins
  return notifyAdmins({
    title: '⚠️ Payment Failed',
    body: `Payment failed for order #${order.orderNumber}`,
    category: 'Payment',
    orderNumber: order.orderNumber,
    adminActionUrl: `/admin/orders/${order._id}`,
    data: { type: 'admin_payment_failed', id: order._id.toString(), orderNumber: order.orderNumber },
  });
};
export const notifyRefundProcessed = (order) => {
  if (order.user) {
    sendNotificationToUser(order.user, {
      title: '💰 Refund Processed',
      body: `Refund of ₹${order.totalAmount} for #${order.orderNumber} is on its way.`,
      category: 'Payment',
      orderNumber: order.orderNumber,
      adminActionUrl: `/admin/orders/${order._id}`,
      userActionUrl: '/account',
      data: { type: 'refund_processed', id: order._id.toString(), orderNumber: order.orderNumber },
    }).catch(() => {});
  }

  // Also notify admins
  return notifyAdmins({
    title: '💸 Refund Processed',
    body: `Refund issued for order #${order.orderNumber}`,
    category: 'Payment',
    orderNumber: order.orderNumber,
    adminActionUrl: `/admin/orders/${order._id}`,
    data: { type: 'admin_refund_processed', id: order._id.toString(), orderNumber: order.orderNumber },
  });
};


export const notifyWelcome = (user) => {
  sendNotificationToUser(user._id, {
    title: '🎉 Welcome to Toyovo India!',
    body: `Hi ${user.firstName}! Discover India's best toy store. Happy shopping!`,
    category: 'Auth',
    adminActionUrl: `/admin/users/${user._id}`,
    userActionUrl: '/',
    data: { type: 'welcome', id: user._id.toString() },
  }).catch(() => {});

  // Also notify admins
  return notifyAdmins({
    title: '🆕 New Explorer Joined',
    body: `${user.firstName} ${user.lastName} just signed up for Toyovo India.`,
    category: 'Auth',
    adminActionUrl: `/admin/users/${user._id}`,
    data: { type: 'admin_new_user', id: user._id.toString() },
  });
};

export const notifySecurityLogin = (user) => {
  return sendNotificationToUser(user._id, {
    title: '🔐 New Login Detected',
    body: 'Your Toyovo India account was just accessed. If this wasn\'t you, secure your account immediately.',
    category: 'Security',
    adminActionUrl: `/admin/users/${user._id}`,
    userActionUrl: '/account',
    data: { type: 'security_login', id: user._id.toString() },
  });
};

// ─────────────────────────────────────────────
// Admin-facing API helpers
// ─────────────────────────────────────────────

/**
 * Sends a notification to all users (broadcast)
 * @param {object} payload - Notification payload
 */
export const broadcastNotification = async (payload) => {
  // Implementation for broadcast if needed
  // This can be done via FCM Topics or by iterating users (topics preferred for scale)
};

/**
 * Sends a notification to all administrators (admin, super_admin).
 */
export const notifyAdmins = async (payload) => {
  try {
    const admins = await User.find({ role: { $in: ['admin', 'super_admin'] }, status: 'Active' });
    if (!admins.length) return;

    logger.info(`Broadcasting notification to ${admins.length} admins: ${payload.title}`);
    
    // We send individual notifications so each admin gets their own log
    for (const adminUser of admins) {
      await sendNotificationToUser(adminUser._id, payload);
    }
  } catch (error) {
    logger.error('Error broadcasting to admins', error);
  }
};

/**
 * Get all notifications for admin (filtered by their adminUserId)
 */
export const getAdminNotifications = async ({ adminUserId, page = 1, limit = 30, unreadOnly = false } = {}) => {
  const filter = {};
  if (adminUserId) filter.userId = adminUserId;
  if (unreadOnly) filter.readByAdmin = false;

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    NotificationLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'firstName lastName email'),
    NotificationLog.countDocuments(filter),
  ]);

  return { 
    items, 
    total, 
    unread: await NotificationLog.countDocuments({ 
      ...(adminUserId && { userId: adminUserId }), 
      readByAdmin: false 
    }) 
  };
};

export const markAdminNotificationsRead = async (adminUserId, ids) => {
  const filter = {};
  if (adminUserId) filter.userId = adminUserId;
  
  if (ids?.length) {
    filter._id = { $in: ids };
  } else {
    filter.readByAdmin = false;
  }
  await NotificationLog.updateMany(filter, { readByAdmin: true });
};
