import Coupon from '../models/Coupon.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { successResponse } from '../utils/apiResponse.js';
import { getValidatedCouponResult, mapCouponForApi } from '../services/coupon.service.js';

export const adminListCoupons = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 20), 100);
  const skip = (page - 1) * limit;
  const filter = {};

  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    const cleanSearch = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (cleanSearch) {
      filter.$or = [
        { code: new RegExp(cleanSearch, 'i') },
        { title: new RegExp(cleanSearch, 'i') },
      ];
    }
  }

  const [coupons, total] = await Promise.all([
    Coupon.find(filter)
      .populate('applicableCategories', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Coupon.countDocuments(filter),
  ]);

  return successResponse(
    res,
    200,
    'Coupons fetched successfully',
    coupons.map(mapCouponForApi),
    { page, limit, total, totalPages: Math.ceil(total / limit) }
  );
});

export const adminCreateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create({
    ...req.body,
    code: req.body.code.toUpperCase(),
    startsAt: req.body.startsAt || undefined,
    expiresAt: req.body.expiresAt || undefined,
  });

  const populatedCoupon = await Coupon.findById(coupon._id).populate('applicableCategories', 'name slug');
  return successResponse(res, 201, 'Coupon created successfully', mapCouponForApi(populatedCoupon));
});

export const adminUpdateCoupon = asyncHandler(async (req, res, next) => {
  const coupon = await Coupon.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      ...(req.body.code && { code: req.body.code.toUpperCase() }),
      ...(req.body.startsAt === '' && { startsAt: undefined }),
      ...(req.body.expiresAt === '' && { expiresAt: undefined }),
    },
    { new: true, runValidators: true }
  ).populate('applicableCategories', 'name slug');

  if (!coupon) {
    return next(new AppError('Coupon not found', 404));
  }

  return successResponse(res, 200, 'Coupon updated successfully', mapCouponForApi(coupon));
});

export const adminUpdateCouponStatus = asyncHandler(async (req, res, next) => {
  const coupon = await Coupon.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true }
  ).populate('applicableCategories', 'name slug');

  if (!coupon) {
    return next(new AppError('Coupon not found', 404));
  }

  return successResponse(res, 200, 'Coupon status updated successfully', mapCouponForApi(coupon));
});

export const validateCoupon = asyncHandler(async (req, res) => {
  const result = await getValidatedCouponResult({
    code: req.body.code,
    subtotal: req.body.subtotal,
    shippingAmount: Number(req.body.shippingAmount || 0),
    categorySlugs: req.body.categorySlugs || [],
  });

  return successResponse(res, 200, 'Coupon is valid', {
    coupon: mapCouponForApi(result.coupon),
    discountAmount: result.discountAmount,
    finalSubtotal: result.finalSubtotal,
  });
});

export const adminDeleteCoupon = asyncHandler(async (req, res, next) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) {
    return next(new AppError('Coupon not found', 404));
  }
  return successResponse(res, 200, 'Coupon deleted successfully');
});
