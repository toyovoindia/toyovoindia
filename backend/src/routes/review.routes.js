import express from 'express';
import {
  getRecentReviews,
  createReview,
  getProductReviews,
  getMyReview,
  updateMyReview,
  deleteMyReview,
  getAllReviews,
  updateReviewStatus,
  deleteReview,
} from '../controllers/review.controller.js';
import { protect, authorizeRoles } from '../middlewares/auth.js';

const router = express.Router();

// ─── Public ───────────────────────────────────────────
router.get('/recent', getRecentReviews);
// optionally pass auth so user's own pending review shows up too
router.get('/product/:id', (req, res, next) => {
  // soft-auth: attach req.user if token present, but don't block unauthenticated
  protect(req, res, (err) => { next(); }); // always continue
}, getProductReviews);

// ─── Customer (authenticated) ──────────────────────────
router.post('/', protect, createReview);
router.get('/my/:productId', protect, getMyReview);
router.put('/:id', protect, updateMyReview);
router.delete('/my/:id', protect, deleteMyReview);

// ─── Admin ─────────────────────────────────────────────
router.use(protect, authorizeRoles('admin', 'super_admin'));
router.get('/', getAllReviews);
router.patch('/:id/status', updateReviewStatus);
router.delete('/:id', deleteReview);

export default router;
