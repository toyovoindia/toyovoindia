import express from 'express';
import { adminCategoryRoutes } from './category.routes.js';
import { adminProductRoutes } from './product.routes.js';
import { adminUserRoutes } from './user.routes.js';
import { adminCouponRoutes } from './coupon.routes.js';
import { adminOrderRoutes } from './order.routes.js';
import { adminSiteRoutes } from './site.routes.js';
import { adminShippingRoutes } from './shipping.routes.js';
import { adminMessageRoutes } from './message.routes.js';
import { adminMediaRoutes } from './media.routes.js';
import { adminPageRoutes } from './pageContent.routes.js';
import { globalAdminSearch } from '../controllers/adminSearch.controller.js';
import { protect, authorizeRoles } from '../middlewares/auth.js';

const router = express.Router();

router.get('/search', protect, authorizeRoles('admin', 'super_admin'), globalAdminSearch);

router.use('/users', adminUserRoutes);
router.use('/coupons', adminCouponRoutes);
router.use('/orders', adminOrderRoutes);
router.use('/categories', adminCategoryRoutes);
router.use('/products', adminProductRoutes);
router.use('/site', adminSiteRoutes);
router.use('/shipping-methods', adminShippingRoutes);
router.use('/messages', adminMessageRoutes);
router.use('/media', adminMediaRoutes);
router.use('/pages', adminPageRoutes);

export default router;
