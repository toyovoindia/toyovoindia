import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');
const optionalString = z.string().trim().optional().or(z.literal(''));

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(1, 'First name is required').optional(),
    lastName: z.string().trim().min(1, 'Last name is required').optional(),
    phone: z.string().trim()
      .regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number format')
      .optional()
      .or(z.literal('')), // allow empty strings to clear phone
  })
});

export const updatePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
  })
});

export const adminListUsersSchema = z.object({
  query: z.object({
    search: optionalString,
    status: z.enum(['Active', 'Inactive', 'Banned']).optional().or(z.literal('')),
    role: z.enum(['customer', 'admin', 'super_admin']).optional().or(z.literal('')),
    sort: z.enum(['recent', 'oldest', 'name', 'email']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(10000).optional(),
  }),
});

export const adminCreateUserSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(1, 'First name is required'),
    lastName: z.string().trim().min(1, 'Last name is required'),
    email: z.string().trim().email('Invalid email address').toLowerCase(),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    phone: z.string().trim().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number format').optional().or(z.literal('')),
    role: z.enum(['customer', 'admin', 'super_admin']).optional(),
    status: z.enum(['Active', 'Inactive', 'Banned']).optional(),
  }),
});

export const adminUpdateUserSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    firstName: z.string().trim().min(1, 'First name is required').optional(),
    lastName: z.string().trim().min(1, 'Last name is required').optional(),
    email: z.string().trim().email('Invalid email address').toLowerCase().optional(),
    phone: z.string().trim().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number format').optional().or(z.literal('')),
    role: z.enum(['customer', 'admin', 'super_admin']).optional(),
    status: z.enum(['Active', 'Inactive', 'Banned']).optional(),
  }),
});

export const adminUpdateUserStatusSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    status: z.enum(['Active', 'Inactive', 'Banned']),
  }),
});

export const adminUserIdParamSchema = z.object({
  params: z.object({ id: objectId }),
});
