import express from 'express';
import {
  adminCreateCoupon,
  adminListCoupons,
  adminUpdateCoupon,
  adminUpdateCouponStatus,
  validateCoupon,
  adminDeleteCoupon,
} from '../controllers/coupon.controller.js';
import { protect, authorizeRoles } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  createCouponSchema,
  listCouponsSchema,
  updateCouponSchema,
  updateCouponStatusSchema,
  validateCouponSchema,
} from '../validators/coupon.validator.js';

const router = express.Router();
const adminRouter = express.Router();

router.post('/validate', validate(validateCouponSchema), validateCoupon);

adminRouter.use(protect, authorizeRoles('admin', 'super_admin'));
adminRouter.get('/', validate(listCouponsSchema), adminListCoupons);
adminRouter.post('/', validate(createCouponSchema), adminCreateCoupon);
adminRouter.patch('/:id', validate(updateCouponSchema), adminUpdateCoupon);
adminRouter.patch('/:id/status', validate(updateCouponStatusSchema), adminUpdateCouponStatus);
adminRouter.delete('/:id', adminDeleteCoupon);

export { adminRouter as adminCouponRoutes };
export default router;
