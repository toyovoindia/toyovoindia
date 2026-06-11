import { z } from 'zod';

const optionalString = z.string().trim().optional().or(z.literal(''));
const optionalNumber = z.coerce.number().optional();
const optionalBoolean = z.boolean().optional();

const mediaSchema = z.object({
  url: z.string().url().optional().or(z.literal('')),
  publicId: optionalString,
  alt: optionalString,
}).optional();

export const updateStorefrontSettingsSchema = z.object({
  body: z.object({
    siteName: optionalString,
    siteLogo: mediaSchema,
    favicon: optionalString,
    maintenanceMode: optionalBoolean,
    
    announcementMessages: z.array(z.string().trim().min(1).max(200)).optional(),
    announcementBg: optionalString,
    announcementTextColor: optionalString,

    currencySymbol: optionalString,
    freeShippingThreshold: optionalNumber,
    defaultShippingFee: optionalNumber,
    taxPercentage: optionalNumber,
    codEnabled: optionalBoolean,

    contactEmail: z.string().email().optional().or(z.literal('')),
    contactPhone: optionalString,
    contactAddress: optionalString,
    
    socialLinks: z.object({
      instagram: optionalString,
      facebook: optionalString,
      twitter: optionalString,
      linkedin: optionalString,
      youtube: optionalString,
    }).optional(),

    storefrontMedia: z.object({
      heroBanner: mediaSchema,
      promoBanners: z.array(mediaSchema).optional(),
      brandLogos: z.array(mediaSchema).optional(),
    }).optional(),
  }).partial(),
});

export const updatePurchasePopupSettingsSchema = z.object({
  body: z.object({
    enabled: z.boolean().optional(),
    initialDelaySeconds: z.coerce.number().int().min(0).max(600).optional(),
    repeatDelaySeconds: z.coerce.number().int().min(30).max(3600).optional(),
    visibleDurationSeconds: z.coerce.number().int().min(5).max(60).optional(),
    maskNames: z.boolean().optional(),
  }),
});
