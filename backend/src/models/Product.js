import mongoose from 'mongoose';
import { createSlug } from '../utils/slug.js';

const productImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: String,
  alt: String,
  sortOrder: { type: Number, default: 0 },
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [180, 'Product name cannot exceed 180 characters'],
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  shortDescription: {
    type: String,
    trim: true,
    maxlength: [500, 'Short description cannot exceed 500 characters'],
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Primary category is required'],
    index: true,
  },
  subcategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  }],
  brand: {
    type: String,
    trim: true,
    index: true,
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  oldPrice: {
    type: Number,
    min: [0, 'Old price cannot be negative'],
  },
  costPrice: {
    type: Number,
    min: [0, 'Cost price cannot be negative'],
    select: false,
  },
  images: {
    type: [productImageSchema],
    default: [],
  },
  thumbnail: {
    url: String,
    publicId: String,
    alt: String,
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative'],
    index: true,
  },
  lowStockThreshold: {
    type: Number,
    default: 5,
    min: 0,
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'archived'],
    default: 'draft',
    index: true,
  },
  ageGroup: {
    type: String,
    trim: true,
    index: true,
  },
  gender: {
    type: String,
    enum: ['Boy', 'Girl', 'Unisex', ''],
    default: 'Unisex',
    index: true,
  },
  material: {
    type: String,
    trim: true,
    index: true,
  },
  color: [String],
  size: [String],
  weight: Number,
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: { type: String, default: 'cm' },
  },
  tags: [String],
  ratingAverage: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  ratingCount: {
    type: Number,
    default: 0,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  soldCount: {
    type: Number,
    default: 0,
    index: true,
  },
  views: {
    type: Number,
    default: 0,
    index: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true,
  },
  isTrending: {
    type: Boolean,
    default: false,
    index: true,
  },
  isNewArrival: {
    type: Boolean,
    default: false,
    index: true,
  },
  isBestSeller: {
    type: Boolean,
    default: false,
    index: true,
  },
  seoTitle: {
    type: String,
    trim: true,
    maxlength: 160,
  },
  seoDescription: {
    type: String,
    trim: true,
    maxlength: 220,
  },
}, {
  timestamps: true,
});

productSchema.pre('validate', function() {
  if (!this.slug && this.name) {
    this.slug = createSlug(this.name);
  }
  if (!this.thumbnail?.url && this.images?.length) {
    this.thumbnail = {
      url: this.images[0].url,
      publicId: this.images[0].publicId,
      alt: this.images[0].alt || this.name,
    };
  }
});

productSchema.index({ name: 'text', description: 'text', tags: 'text', brand: 'text' });
productSchema.index({ status: 1, category: 1, price: 1 });
productSchema.index({ status: 1, createdAt: -1 });

const Product = mongoose.model('Product', productSchema);
export default Product;
