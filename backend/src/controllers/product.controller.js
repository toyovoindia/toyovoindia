import Product from '../models/Product.js';
import Category from '../models/Category.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { successResponse } from '../utils/apiResponse.js';
import { createSlug } from '../utils/slug.js';

const sortMap = {
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  'alpha-asc': { name: 1 },
  'alpha-desc': { name: -1 },
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  'best-selling': { soldCount: -1, ratingAverage: -1 },
  relevance: { isFeatured: -1, createdAt: -1 },
};

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const resolveCategoryId = async (slug) => {
  if (!slug) return undefined;
  const category = await Category.findOne({ slug, isActive: true }).select('_id');
  return category?._id;
};

const buildProductFilter = async (query, publicOnly = true) => {
  const filter = {};
  if (publicOnly) filter.status = 'active';

  const categoryId = await resolveCategoryId(query.category);
  if (categoryId) filter.category = categoryId;

  const subcategoryId = await resolveCategoryId(query.subcategory);
  if (subcategoryId) filter.subcategories = subcategoryId;

  if (query.search && query.search.trim()) {
    const searchRegex = new RegExp(escapeRegExp(query.search.trim()), 'i');
    
    // Find any categories that match the search term
    const matchingCategories = await Category.find({ name: searchRegex }).select('_id');
    const matchingCategoryIds = matchingCategories.map(c => c._id);

    filter.$or = [
      { name: searchRegex },
      { description: searchRegex },
      { brand: searchRegex },
      { tags: searchRegex },
    ];

    if (matchingCategoryIds.length > 0) {
      filter.$or.push({ category: { $in: matchingCategoryIds } });
      filter.$or.push({ subcategories: { $in: matchingCategoryIds } });
    }
  }

  if (query.brand) {
    const brands = query.brand.split(',').map(b => b.trim()).filter(Boolean);
    if (brands.length > 0) {
      filter.brand = { $in: brands.map(b => new RegExp('^' + escapeRegExp(b) + '$', 'i')) };
    }
  }

  if (query.ageGroup) {
    const ages = query.ageGroup.split(',').map(a => a.trim()).filter(Boolean);
    if (ages.length > 0) {
      filter.ageGroup = { $in: ages.map(a => new RegExp('^' + escapeRegExp(a) + '$', 'i')) };
    }
  }

  if (query.gender) {
    const genders = query.gender.split(',').map(g => g.trim()).filter(Boolean);
    if (genders.length > 0) {
      filter.gender = { $in: genders.map(g => new RegExp('^' + escapeRegExp(g) + '$', 'i')) };
    }
  }

  if (query.material) {
    const materials = query.material.split(',').map(m => m.trim()).filter(Boolean);
    if (materials.length > 0) {
      filter.material = { $in: materials.map(m => new RegExp('^' + escapeRegExp(m) + '$', 'i')) };
    }
  }
  
  if (query.color) {
    const colors = query.color.split(',').map(c => c.trim()).filter(Boolean);
    if (colors.length > 0) {
      filter.color = { $in: colors.map(c => new RegExp('^' + escapeRegExp(c) + '$', 'i')) };
    }
  }
  
  if (query.size) {
    const sizes = query.size.split(',').map(s => s.trim()).filter(Boolean);
    if (sizes.length > 0) {
      filter.size = { $in: sizes.map(s => new RegExp('^' + escapeRegExp(s) + '$', 'i')) };
    }
  }

  if (query.availability) {
    const availabilities = query.availability.split(',').map(a => a.trim()).filter(Boolean);
    if (availabilities.includes('in stock') && availabilities.includes('out of stock')) {
      // both selected: do not filter by stock (show all)
    } else if (availabilities.includes('in stock')) {
      filter.stock = { $gt: 0 };
    } else if (availabilities.includes('out of stock')) {
      filter.stock = { $lte: 0 };
    }
  }

  if (query.discount) {
    const discounts = query.discount.split(',').map(d => {
      const match = d.match(/\d+/);
      return match ? parseInt(match[0], 10) : null;
    }).filter(d => d !== null);

    if (discounts.length > 0) {
      const minDiscount = Math.min(...discounts);
      filter.oldPrice = { $exists: true, $gt: 0 };
      filter.$expr = {
        $gte: [
          {
            $multiply: [
              { $divide: [ { $subtract: [ '$oldPrice', '$price' ] }, '$oldPrice' ] },
              100
            ]
          },
          minDiscount
        ]
      };
    }
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {};
    if (query.minPrice !== undefined) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice !== undefined) filter.price.$lte = Number(query.maxPrice);
  }

  return filter;
};

export const listProducts = asyncHandler(async (req, res) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 12;
  const skip = (page - 1) * limit;
  const filter = await buildProductFilter(req.query, true);
  const sort = sortMap[req.query.sort || 'relevance'] || sortMap.relevance;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .populate('subcategories', 'name slug')
      .sort(sort)
      .collation({ locale: 'en', strength: 2 })
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  return successResponse(res, 200, 'Products fetched successfully', products, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

export const getProductBrands = asyncHandler(async (req, res) => {
  const brands = await Product.distinct('brand', { 
    status: 'active', 
    brand: { $ne: null, $ne: '' } 
  });

  const uniqueBrandsMap = new Map();
  for (const b of brands) {
    const trimmed = b.trim();
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();
    
    // Capitalize first letter of brand to normalize "toyovo", "TOYOVO" -> "Toyovo"
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    
    if (!uniqueBrandsMap.has(lower)) {
      uniqueBrandsMap.set(lower, formatted);
    }
  }

  const cleanBrands = Array.from(uniqueBrandsMap.values());
  cleanBrands.sort((a, b) => a.localeCompare(b));
  return successResponse(res, 200, 'Brands fetched successfully', cleanBrands);
});

export const getProductBySlug = asyncHandler(async (req, res, next) => {
  const product = await Product.findOneAndUpdate(
    { slug: req.params.slug, status: 'active' },
    { $inc: { views: 1 } },
    { new: true, runValidators: true }
  )
    .populate('category', 'name slug')
    .populate('subcategories', 'name slug');

  if (!product) return next(new AppError('Product not found', 404));

  return successResponse(res, 200, 'Product details', product);
});

export const listFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ status: 'active', isFeatured: true }).sort({ createdAt: -1 }).limit(12);
  return successResponse(res, 200, 'Featured products', products);
});

export const listTrendingProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ status: 'active', isTrending: true }).sort({ soldCount: -1, createdAt: -1 }).limit(12);
  return successResponse(res, 200, 'Trending products', products);
});

export const listNewArrivals = asyncHandler(async (req, res) => {
  const products = await Product.find({ status: 'active', isNewArrival: true }).sort({ createdAt: -1 }).limit(12);
  return successResponse(res, 200, 'New arrival products', products);
});

export const listBestSellers = asyncHandler(async (req, res) => {
  const products = await Product.find({ status: 'active', isBestSeller: true }).sort({ soldCount: -1 }).limit(12);
  return successResponse(res, 200, 'Best seller products', products);
});

export const adminListProducts = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 20), 10000);
  const skip = (page - 1) * limit;
  const filter = await buildProductFilter(req.query, false);
  if (req.query.status) {
    if (req.query.status === 'low-stock') {
      filter.stock = { $gt: 0, $lte: 10 };
      filter.status = 'active';
    } else if (req.query.status === 'out-of-stock') {
      filter.stock = { $lte: 0 };
      filter.status = 'active';
    } else if (req.query.status === 'inactive') {
      filter.status = { $in: ['inactive', 'draft'] };
    } else {
      filter.status = req.query.status;
    }
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .populate('subcategories', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  return successResponse(res, 200, 'Admin products', products, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

export const adminCreateProduct = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
    slug: req.body.slug ? createSlug(req.body.slug) : createSlug(req.body.name),
  };
  const product = await Product.create(payload);
  return successResponse(res, 201, 'Product created successfully', product);
});

export const adminGetProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name slug')
    .populate('subcategories', 'name slug');
  if (!product) return next(new AppError('Product not found', 404));
  return successResponse(res, 200, 'Admin product details', product);
});

export const adminUpdateProduct = asyncHandler(async (req, res, next) => {
  const payload = { ...req.body };
  if (payload.slug) payload.slug = createSlug(payload.slug);

  const product = await Product.findByIdAndUpdate(req.params.id, payload, { returnDocument: 'after', runValidators: true });
  if (!product) return next(new AppError('Product not found', 404));

  return successResponse(res, 200, 'Product updated successfully', product);
});

export const adminDeleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { status: 'archived' }, { returnDocument: 'after' });
  if (!product) return next(new AppError('Product not found', 404));

  return successResponse(res, 200, 'Product archived successfully', product);
});

export const adminPermanentlyDeleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return next(new AppError('Product not found', 404));

  return successResponse(res, 200, 'Product permanently deleted successfully');
});

export const adminUpdateProductStatus = asyncHandler(async (req, res, next) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { status: req.body.status }, { returnDocument: 'after', runValidators: true });
  if (!product) return next(new AppError('Product not found', 404));

  return successResponse(res, 200, 'Product status updated successfully', product);
});

export const adminUpdateProductStock = asyncHandler(async (req, res, next) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    {
      stock: req.body.stock,
      ...(req.body.lowStockThreshold !== undefined && { lowStockThreshold: req.body.lowStockThreshold }),
    },
    { returnDocument: 'after', runValidators: true }
  );
  if (!product) return next(new AppError('Product not found', 404));

  return successResponse(res, 200, 'Product stock updated successfully', product);
});
