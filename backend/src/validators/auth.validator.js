import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(1, 'First name is required'),
    lastName: z.string().trim().min(1, 'Last name is required'),
    email: z.string().trim().email('Invalid email address').toLowerCase(),
    phone: z.string().trim().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number format').optional().or(z.literal('')),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().refine((val) => {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      const isPhone = /^[6-9]\d{9}$/.test(val);
      return isEmail || isPhone;
    }, {
      message: 'Invalid email address or 10-digit mobile number starting with 6-9'
    }),
    password: z.string().min(1, 'Password is required'),
    portal: z.string().optional(),
  })
});
