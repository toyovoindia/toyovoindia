import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userPreferenceItemSchema = new mongoose.Schema({}, { _id: false, strict: false });
const userAddressSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, default: 'Home' },
  firstName: { type: String, trim: true, default: '' },
  lastName: { type: String, trim: true, default: '' },
  address: { type: String, trim: true, default: '' },
  apartment: { type: String, trim: true, default: '' },
  city: { type: String, trim: true, default: '' },
  district: { type: String, trim: true, default: '' },
  state: { type: String, trim: true, default: '' },
  postalCode: { type: String, trim: true, default: '' },
  phone: { type: String, trim: true, default: '' },
  isDefault: { type: Boolean, default: false },
}, { _id: false });

const userPaymentMethodSchema = new mongoose.Schema({}, { _id: false, strict: false });
const userPaymentHistorySchema = new mongoose.Schema({}, { _id: false, strict: false });

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^[a-zA-Z\s]+$/.test(v);
      },
      message: 'First name must contain only alphabets'
    }
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^[a-zA-Z\s]+$/.test(v);
      },
      message: 'Last name must contain only alphabets'
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    select: false,
  },
  phone: {
    type: String,
    trim: true,
    unique: true,
    sparse: true,
    index: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters']
  },
  role: {
    type: String,
    enum: ['customer', 'admin', 'super_admin'],
    default: 'customer',
  },
  phoneVerified: {
    type: Boolean,
    default: false,
  },
  phoneOtp: {
    type: String,
    select: false,
  },
  phoneOtpExpires: {
    type: Date,
    select: false,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Banned'],
    default: 'Active',
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  lastLoginAt: {
    type: Date,
  },
  passwordChangedAt: {
    type: Date,
  },
  resetPasswordOTP: {
    type: String,
    select: false,
  },
  resetPasswordExpires: {
    type: Date,
    select: false,
  },
  preferences: {
    cart: {
      type: [userPreferenceItemSchema],
      default: [],
    },
    wishlist: {
      type: [userPreferenceItemSchema],
      default: [],
    },
    compare: {
      type: [userPreferenceItemSchema],
      default: [],
    },
  },
  addresses: {
    type: [userAddressSchema],
    default: [],
  },
  paymentVault: {
    bankAccounts: {
      type: [userPaymentMethodSchema],
      default: [],
    },
    upiIds: {
      type: [userPaymentMethodSchema],
      default: [],
    },
    cards: {
      type: [userPaymentMethodSchema],
      default: [],
    },
  },
  paymentHistory: {
    type: [userPaymentHistorySchema],
    default: [],
  },
  fcmTokens: {
    type: [String],
    default: [],
  },
  fcmTokenMobile: {
    type: [String],
    default: [],
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.passwordHash;
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    transform: function(doc, ret) {
      delete ret.passwordHash;
      delete ret.__v;
      return ret;
    }
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

const User = mongoose.model('User', userSchema);
export default User;
