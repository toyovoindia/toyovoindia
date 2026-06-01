import { z } from 'zod';

export const shippingMethodSchema = z.object({
  body: z.object({
    code: z.string().trim().min(2).max(40).optional(),
    name: z.string().trim().min(2).max(80),
    minDays: z.coerce.number().int().min(0),
    maxDays: z.coerce.number().int().min(0),
    charge: z.coerce.number().min(0),
    rule: z.string().trim().max(160).optional().or(z.literal('')),
    status: z.enum(['active', 'inactive']).optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
  }).refine((data) => data.minDays <= data.maxDays, {
    message: "Minimum days must be less than or equal to maximum days",
    path: ["minDays"],
  }),
});

export const shippingMethodIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id'),
  }),
});
