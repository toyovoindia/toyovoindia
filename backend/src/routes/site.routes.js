import express from 'express';
import { getDashboardStats, getPurchasePopupSettings, getStorefrontSettings, updatePurchasePopupSettings, updateStorefrontSettings } from '../controllers/site.controller.js';
import { authorizeRoles, protect } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { updatePurchasePopupSettingsSchema, updateStorefrontSettingsSchema } from '../validators/site.validator.js';

const router = express.Router();
const adminRouter = express.Router();

router.get('/storefront', getStorefrontSettings);
router.get('/purchase-popup', getPurchasePopupSettings);

adminRouter.use(protect, authorizeRoles('admin', 'super_admin'));
adminRouter.get('/dashboard-stats', getDashboardStats);
adminRouter.get('/storefront', getStorefrontSettings);
adminRouter.patch('/storefront', validate(updateStorefrontSettingsSchema), updateStorefrontSettings);
adminRouter.get('/purchase-popup', getPurchasePopupSettings);
adminRouter.patch('/purchase-popup', validate(updatePurchasePopupSettingsSchema), updatePurchasePopupSettings);

export { adminRouter as adminSiteRoutes };
export default router;
