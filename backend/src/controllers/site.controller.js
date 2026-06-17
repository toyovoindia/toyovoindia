import SiteConfig from '../models/SiteConfig.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';

const ensureSiteConfig = async () => {
  let config = await SiteConfig.findOne({ key: 'default' });
  if (!config) {
    config = await SiteConfig.create({ key: 'default' });
  }
  return config;
};

const maskName = (value) => {
  if (!value) return 'Someone';
  const trimmed = String(value).trim();
  if (trimmed.length <= 1) return trimmed;
  return `${trimmed[0]}${'*'.repeat(Math.max(trimmed.length - 1, 1))}`;
};

export const getStorefrontSettings = asyncHandler(async (req, res) => {
  const config = await ensureSiteConfig();
  return successResponse(res, 200, 'Storefront settings fetched successfully', config);
});

export const updateStorefrontSettings = asyncHandler(async (req, res) => {
  let config = await ensureSiteConfig();
  
  // Dynamic update: handle nested objects like socialLinks or storefrontMedia
  Object.keys(req.body).forEach(key => {
    if (typeof req.body[key] === 'object' && !Array.isArray(req.body[key]) && req.body[key] !== null) {
      config[key] = {
        ...config[key]?.toObject?.() || config[key],
        ...req.body[key]
      };
      config.markModified(key);
    } else {
      config[key] = req.body[key];
      config.markModified(key);
    }
  });

  await config.save();
  return successResponse(res, 200, 'Storefront settings updated successfully', config);
});

export const getPurchasePopupSettings = asyncHandler(async (req, res) => {
  const config = await ensureSiteConfig();
  const orders = await Order.find({ paymentStatus: 'paid' }).sort({ createdAt: -1 }).limit(10);
  const activities = orders.map((order) => ({
    id: order._id.toString(),
    name: config.purchasePopup.maskNames ? maskName(order.customer.firstName) : order.customer.firstName,
    city: order.shippingAddress.city === 'Other' ? order.shippingAddress.district : order.shippingAddress.city,
    product: order.items?.[0]?.productName || 'Toy',
    image: order.items?.[0]?.image || '',
    status: 'Public',
    createdAt: order.createdAt,
  }));

  return successResponse(res, 200, 'Purchase popup settings fetched successfully', {
    settings: config.purchasePopup,
    activities,
  });
});

export const updatePurchasePopupSettings = asyncHandler(async (req, res) => {
  const config = await ensureSiteConfig();
  config.purchasePopup = {
    ...config.purchasePopup.toObject(),
    ...req.body,
  };
});

export const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalProducts, totalUsers, totalOrders, productsData] = await Promise.all([
    Product.countDocuments({ status: { $ne: 'archived' } }),
    User.countDocuments(),
    Order.countDocuments(),
    Product.find({ status: { $ne: 'archived' } }).select('category categoryName name title sku stock status lowStockThreshold').populate('category', 'name').lean()
  ]);

  const lowStockProducts = productsData
    .filter(p => p.status === 'active' && Number(p.stock || 0) <= Number(p.lowStockThreshold || 5))
    .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0));

  const categoryCountMap = new Map();
  productsData.forEach(p => {
    const name = p.category?.name || p.categoryName || p.category || 'Uncategorized';
    const actualName = typeof name === 'string' ? name : name.name || 'Uncategorized';
    categoryCountMap.set(actualName, (categoryCountMap.get(actualName) || 0) + 1);
  });
  
  const sortedCategories = Array.from(categoryCountMap.entries()).sort((a, b) => b[1] - a[1]);
  const top3 = sortedCategories.slice(0, 3);
  const othersCount = sortedCategories.slice(3).reduce((sum, [, count]) => sum + count, 0);
  
  const finalCategories = [...top3];
  if (othersCount > 0) finalCategories.push(['Other Categories', othersCount]);
  const totalCategorized = finalCategories.reduce((sum, [, count]) => sum + count, 0) || 1;
  const categoryBreakdown = finalCategories.map(([label, count], index) => ({
    label,
    count,
    percent: `${Math.round((count / totalCategorized) * 100)}%`,
    color: ['bg-[#6651A4]', 'bg-[#F1641E]', 'bg-[#E8312A]', 'bg-gray-400'][index] || 'bg-gray-400',
  }));

  const wishlistAggregation = await User.aggregate([
    { $unwind: "$preferences.wishlist" },
    { $group: { _id: { $cond: [{ $ifNull: ["$preferences.wishlist.title", false] }, "$preferences.wishlist.title", { $cond: [{ $ifNull: ["$preferences.wishlist.name", false] }, "$preferences.wishlist.name", "$preferences.wishlist.slug"] }] }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 3 },
    { $project: { _id: 0, name: { $ifNull: ["$_id", "Wishlist Item"] }, count: 1 } }
  ]);

  return successResponse(res, 200, 'Dashboard Stats', {
    totalProducts,
    totalUsers,
    totalOrders,
    categoryBreakdown,
    wishlistTrends: wishlistAggregation,
    lowStockProducts
  });
});
