import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');
const optionalString = z.string().trim().optional().or(z.literal(''));

const imageSchema = z.object({
  url: z.string().url(),
  publicId: optionalString,
  alt: optionalString,
  sortOrder: z.number().int().min(0).optional(),
});

const productPayload = {
  name: z.string().trim().min(2).max(180),
  slug: optionalString,
  sku: optionalString,
  description: optionalString,
  shortDescription: z.string().trim().max(500).optional().or(z.literal('')),
  category: objectId,
  subcategories: z.array(objectId).optional(),
  brand: optionalString,
  price: z.number().min(0),
  oldPrice: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  images: z.array(imageSchema).optional(),
  thumbnail: z.object({
    url: z.string().url().optional().or(z.literal('')),
    publicId: optionalString,
    alt: optionalString,
  }).optional(),
  stock: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  status: z.enum(['draft', 'active', 'inactive', 'archived']).optional(),
  ageGroup: optionalString,
  gender: z.enum(['Boy', 'Girl', 'Unisex', '']).optional(),
  material: optionalString,
  color: z.array(z.string().trim()).optional(),
  size: z.array(z.string().trim()).optional(),
  weight: z.number().min(0).optional(),
  dimensions: z.object({
    length: z.number().min(0).optional(),
    width: z.number().min(0).optional(),
    height: z.number().min(0).optional(),
    unit: z.string().trim().optional(),
  }).optional(),
  tags: z.array(z.string().trim()).optional(),
  isFeatured: z.boolean().optional(),
  isTrending: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  seoTitle: z.string().trim().max(160).optional().or(z.literal('')),
  seoDescription: z.string().trim().max(220).optional().or(z.literal('')),
};

export const listProductsSchema = z.object({
  query: z.object({
    category: optionalString,
    subcategory: optionalString,
    search: optionalString,
    brand: optionalString,
    ageGroup: optionalString,
    gender: optionalString,
    material: optionalString,
    color: optionalString,
    size: optionalString,
    availability: optionalString,
    discount: optionalString,
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    sort: z.enum(['relevance', 'price-asc', 'price-desc', 'alpha-asc', 'alpha-desc', 'newest', 'oldest', 'best-selling']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(10000).optional(),
  }),
});

export const createProductSchema = z.object({
  body: z.object(productPayload),
});

export const updateProductSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object(productPayload).partial(),
});

export const productIdParamSchema = z.object({
  params: z.object({ id: objectId }),
});

export const productStatusSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    status: z.enum(['draft', 'active', 'inactive', 'archived']),
  }),
});

export const productStockSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    stock: z.number().int().min(0),
    lowStockThreshold: z.number().int().min(0).optional(),
  }),
});
