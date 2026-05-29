import mongoose from 'mongoose';

const siteConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: 'default',
  },
  // --- General Settings ---
  siteName: { type: String, default: 'Toyove India' },
  siteLogo: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' }
  },
  favicon: { type: String, default: '' },
  maintenanceMode: { type: Boolean, default: false },

  // --- Announcement Bar ---
  announcementMessages: {
    type: [String],
    default: [
      'Free Shipping On Orders Over ₹999!',
      '10% off your next order, use code : TOYOVOINDIA001',
      'New arrivals every week - shop now',
    ],
  },
  announcementBg: { type: String, default: '#6651A4' },
  announcementTextColor: { type: String, default: '#FFFFFF' },

  // --- Financial & Shipping ---
  currencySymbol: { type: String, default: '₹' },
  freeShippingThreshold: { type: Number, default: 999 },
  defaultShippingFee: { type: Number, default: 99 },
  taxPercentage: { type: Number, default: 0 },
  codEnabled: { type: Boolean, default: true },

  // --- Contact & Social ---
  contactEmail: { type: String, default: 'support@toyoveindia.com' },
  contactPhone: { type: String, default: '+91 9876543210' },
  contactAddress: { type: String, default: 'Toyove India HQ, New Delhi' },
  socialLinks: {
    instagram: { type: String, default: '' },
    facebook: { type: String, default: '' },
    twitter: { type: String, default: '' },
    linkedin: { type: String, default: '' }
  },

  // --- Storefront Media (Hero Slider) ---
  storefrontMedia: {
    showDefaultHero: { type: Boolean, default: true },
    heroBanners: {
      type: [{
        url: { type: String, default: '' },
        publicId: { type: String, default: '' },
        alt: { type: String, default: '' },
      }],
      default: [],
    },
  },

  // --- Existing Popup Settings ---
  purchasePopup: {
    enabled: { type: Boolean, default: true },
    initialDelaySeconds: { type: Number, default: 60 },
    repeatDelaySeconds: { type: Number, default: 120 },
    visibleDurationSeconds: { type: Number, default: 10 },
    maskNames: { type: Boolean, default: true },
  },
}, { timestamps: true });

const SiteConfig = mongoose.model('SiteConfig', siteConfigSchema);
export default SiteConfig;
