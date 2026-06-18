import express from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';
import { getAdminNotifications, markAdminNotificationsRead } from '../services/notification.service.js';
import { protect, authorizeRoles } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect, authorizeRoles('admin', 'super_admin'));

// GET /api/notifications/admin — paginated notification log
router.get('/admin', asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 30);
  const unreadOnly = req.query.unreadOnly === 'true';

  const { items, total, unread } = await getAdminNotifications({ 
    adminUserId: req.user._id, 
    page, 
    limit, 
    unreadOnly 
  });

  return successResponse(res, 200, 'Admin notifications fetched', items, {
    page, limit, total,
    totalPages: Math.ceil(total / limit),
    unread,
  });
}));

// GET /api/notifications/admin/unread-count — badge count
router.get('/admin/unread-count', asyncHandler(async (req, res) => {
  const { unread } = await getAdminNotifications({ adminUserId: req.user._id, limit: 1 });
  return successResponse(res, 200, 'Unread count', { unread });
}));

// PATCH /api/notifications/admin/mark-read — mark all or selected as read
router.patch('/admin/mark-read', asyncHandler(async (req, res) => {
  await markAdminNotificationsRead(req.user._id, req.body.ids);
  return successResponse(res, 200, 'Notifications marked as read');
}));

export default router;
