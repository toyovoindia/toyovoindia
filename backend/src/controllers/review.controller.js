import Review from '../models/Review.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * @desc    Get all recent reviews for homepage testimonials
 * @route   GET /api/reviews/recent
 * @access  Public
 */
export const getRecentReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ status: 'approved' })
    .sort({ createdAt: -1 })
    .limit(8)
    .populate('user', 'firstName lastName avatar');

  return successResponse(res, 200, 'Recent reviews fetched', reviews);
});

/**
 * @desc    Submit or update a review (auto-approved — no admin gate)
 * @route   POST /api/reviews
 * @access  Private
 */
export const createReview = asyncHandler(async (req, res) => {
  const { product, rating, comment } = req.body;

  if (!product || !rating || !comment?.trim()) {
    return res.status(400).json({ success: false, message: 'Product, rating, and comment are required.' });
  }

  // Check if user already reviewed this product → update it
  let review = await Review.findOne({ product, user: req.user._id });

  if (review) {
    review.rating = rating;
    review.comment = comment.trim();
    review.status = 'approved'; // auto-approve on update too
    review.userName = `${req.user.firstName} ${req.user.lastName}`;
    await review.save();
    return successResponse(res, 200, 'Review updated successfully', review);
  }

  // Create new review — auto-approved (no admin gate)
  review = await Review.create({
    product,
    user: req.user._id,
    userName: `${req.user.firstName} ${req.user.lastName}`,
    rating,
    comment: comment.trim(),
    role: 'Verified Buyer',
    status: 'approved', // auto-approve
  });

  return successResponse(res, 201, 'Review submitted successfully', review);
});

/**
 * @desc    Get all reviews for a product (approved + current user's pending)
 * @route   GET /api/reviews/product/:id
 * @access  Public (optional auth)
 */
export const getProductReviews = asyncHandler(async (req, res) => {
  const productId = req.params.id;

  // Build query: approved reviews + logged-in user's own review (any status)
  const orConditions = [{ product: productId, status: 'approved' }];

  if (req.user?._id) {
    orConditions.push({ product: productId, user: req.user._id });
  }

  const reviews = await Review.find({ $or: orConditions })
    .sort({ createdAt: -1 })
    .populate('user', 'firstName lastName avatar');

  // Deduplicate (user's own review may appear in both conditions)
  const uniqueMap = new Map();
  for (const r of reviews) {
    uniqueMap.set(r._id.toString(), r);
  }
  const uniqueReviews = [...uniqueMap.values()];

  return successResponse(res, 200, 'Product reviews fetched', uniqueReviews);
});

/**
 * @desc    Get the current user's review for a specific product
 * @route   GET /api/reviews/my/:productId
 * @access  Private
 */
export const getMyReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({
    product: req.params.productId,
    user: req.user._id,
  });

  return successResponse(res, 200, 'My review fetched', review || null);
});

/**
 * @desc    Update customer's own review
 * @route   PUT /api/reviews/:id
 * @access  Private
 */
export const updateMyReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) return next(new AppError('Review not found', 404));
  if (review.user.toString() !== req.user._id.toString()) {
    return next(new AppError('You can only edit your own review', 403));
  }

  const { rating, comment } = req.body;
  if (rating) review.rating = rating;
  if (comment?.trim()) review.comment = comment.trim();
  review.status = 'approved'; // stays approved after edit

  await review.save();
  return successResponse(res, 200, 'Review updated successfully', review);
});

/**
 * @desc    Delete customer's own review
 * @route   DELETE /api/reviews/my/:id
 * @access  Private
 */
export const deleteMyReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) return next(new AppError('Review not found', 404));
  if (review.user.toString() !== req.user._id.toString()) {
    return next(new AppError('You can only delete your own review', 403));
  }

  const productId = review.product;
  await Review.findByIdAndDelete(req.params.id);

  // Recalculate product rating after deletion
  const stats = await Review.aggregate([
    { $match: { product: productId, status: 'approved' } },
    { $group: { _id: '$product', nRating: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
  ]);
  const { default: mongoose } = await import('mongoose');
  await mongoose.model('Product').findByIdAndUpdate(productId, {
    ratingAverage: stats[0]?.avgRating?.toFixed(1) || 0,
    ratingCount: stats[0]?.nRating || 0,
    reviewCount: stats[0]?.nRating || 0,
  });

  return successResponse(res, 200, 'Review deleted successfully');
});

/**
 * @desc    Get all reviews (Admin)
 * @route   GET /api/reviews
 * @access  Private/Admin
 */
export const getAllReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .sort({ createdAt: -1 })
    .populate('product', 'name')
    .populate('user', 'firstName lastName email');

  return successResponse(res, 200, 'All reviews fetched', reviews);
});

/**
 * @desc    Update review status (Admin)
 * @route   PATCH /api/reviews/:id/status
 * @access  Private/Admin
 */
export const updateReviewStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  if (!review) {
    return res.status(404).json({ message: 'Review not found' });
  }

  return successResponse(res, 200, `Review status updated to ${status}`, review);
});

/**
 * @desc    Delete a review (Admin)
 * @route   DELETE /api/reviews/:id
 * @access  Private/Admin
 */
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);

  if (!review) {
    return res.status(404).json({ message: 'Review not found' });
  }

  // Recalculate product rating after deletion
  const stats = await Review.aggregate([
    { $match: { product: review.product, status: 'approved' } },
    { $group: { _id: '$product', nRating: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
  ]);
  const { default: mongoose } = await import('mongoose');
  await mongoose.model('Product').findByIdAndUpdate(review.product, {
    ratingAverage: stats[0]?.avgRating?.toFixed(1) || 0,
    ratingCount: stats[0]?.nRating || 0,
    reviewCount: stats[0]?.nRating || 0,
  });

  return successResponse(res, 200, 'Review deleted successfully');
});
