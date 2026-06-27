import User from '../models/User.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';

export const globalAdminSearch = asyncHandler(async (req, res) => {
  const query = req.query.q?.trim();
  if (!query) {
    return successResponse(res, 200, 'Search results', []);
  }

  // Define regex for text matching (case insensitive)
  const regex = new RegExp(query, 'i');

  const [users, orders, products] = await Promise.all([
    User.find({
      $or: [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { phone: regex },
      ]
    }).limit(5).select('_id firstName lastName email phone role avatar'),

    Order.find({
      $or: [
        { orderNumber: regex },
        { 'customer.firstName': regex },
        { 'customer.email': regex },
        { 'customer.phone': regex },
      ]
    }).limit(5).select('_id orderNumber status totalAmount createdAt customer'),

    Product.find({
      $or: [
        { name: regex },
        { sku: regex },
      ]
    }).limit(5).select('_id name sku price status images')
  ]);

  const results = [];

  users.forEach(u => {
    results.push({
      type: 'user',
      id: u._id,
      title: `${u.firstName} ${u.lastName}`,
      subtitle: u.email,
      avatar: u.avatar || null,
      url: `/admin/users/${u._id}`
    });
  });

  orders.forEach(o => {
    results.push({
      type: 'order',
      id: o._id,
      title: `Order #${o.orderNumber}`,
      subtitle: `${o.customer?.firstName} - ₹${o.totalAmount} (${o.status})`,
      url: `/admin/orders/${o._id}`
    });
  });

  products.forEach(p => {
    results.push({
      type: 'product',
      id: p._id,
      title: p.name,
      subtitle: `SKU: ${p.sku} - ₹${p.price}`,
      image: p.images?.[0] || null,
      url: `/admin/products/${p._id}`
    });
  });

  // Additional static matches for settings etc.
  if ('settings'.match(regex)) {
    results.push({ type: 'page', id: 'settings', title: 'Settings', subtitle: 'Manage platform settings', url: '/admin/settings' });
  }
  if ('coupons'.match(regex) || 'discounts'.match(regex)) {
    results.push({ type: 'page', id: 'coupons', title: 'Coupons', subtitle: 'Manage discount coupons', url: '/admin/coupons' });
  }
  if ('finance'.match(regex) || 'money'.match(regex)) {
    results.push({ type: 'page', id: 'finance', title: 'Financial Hub', subtitle: 'View revenue and ledger', url: '/admin/finance' });
  }

  return successResponse(res, 200, 'Search results fetched', results);
});
