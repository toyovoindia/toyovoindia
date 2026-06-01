import ShippingMethod from '../models/ShippingMethod.js';
import SiteConfig from '../models/SiteConfig.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { successResponse } from '../utils/apiResponse.js';

const DEFAULT_METHODS = [
  { code: 'standard', name: 'Standard Shipping', minDays: 3, maxDays: 5, charge: 15, rule: 'Default India-wide shipping', status: 'active', sortOrder: 1 },
  { code: 'express', name: 'Express Delivery', minDays: 1, maxDays: 2, charge: 45, rule: 'Metro and serviceable pincodes', status: 'active', sortOrder: 2 },
];

const ensureShippingMethods = async () => {
  const count = await ShippingMethod.countDocuments();
  if (count === 0) {
    await ShippingMethod.insertMany(DEFAULT_METHODS);
  }
};

export const listShippingMethods = asyncHandler(async (req, res) => {
  await ensureShippingMethods();
  const subtotal = Number(req.query.subtotal || 0);
  
  const [methods, config] = await Promise.all([
    ShippingMethod.find({ status: 'active' }).sort({ sortOrder: 1, createdAt: 1 }),
    SiteConfig.findOne({ key: 'default' })
  ]);

  // If subtotal is provided and exceeds the threshold in SiteConfig, set standard shipping charge to 0
  const threshold = config?.freeShippingThreshold || 999;
  
  const mappedMethods = methods.map(method => {
    const plainMethod = method.toObject();
    if (subtotal >= threshold && plainMethod.code === 'standard') {
      plainMethod.charge = 0;
      plainMethod.name = `${plainMethod.name} (Free)`;
    }
    return plainMethod;
  });

  return successResponse(res, 200, 'Shipping methods fetched successfully', mappedMethods);
});

export const adminListShippingMethods = asyncHandler(async (req, res) => {
  await ensureShippingMethods();
  const methods = await ShippingMethod.find().sort({ sortOrder: 1, createdAt: 1 });
  return successResponse(res, 200, 'Admin shipping methods fetched successfully', methods);
});

export const adminCreateShippingMethod = asyncHandler(async (req, res) => {
  const method = await ShippingMethod.create(req.body);
  return successResponse(res, 201, 'Shipping method created successfully', method);
});

export const adminUpdateShippingMethod = asyncHandler(async (req, res, next) => {
  const method = await ShippingMethod.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!method) return next(new AppError('Shipping method not found', 404));
  return successResponse(res, 200, 'Shipping method updated successfully', method);
});

export const adminDeleteShippingMethod = asyncHandler(async (req, res, next) => {
  const method = await ShippingMethod.findByIdAndDelete(req.params.id);
  if (!method) return next(new AppError('Shipping method not found', 404));
  return successResponse(res, 200, 'Shipping method deleted successfully');
});
