import express from 'express';
import { exportTransactionLogs } from '../controllers/report.controller.js';
import { protect, authorizeRoles } from '../middlewares/auth.js';

const router = express.Router();

// Apply auth middleware to all report routes
router.use(protect, authorizeRoles('admin', 'super_admin'));

// Route for highly detailed order logs export
router.get('/transactions/export', exportTransactionLogs);

// Export for admin routes
export const adminReportRoutes = router;
