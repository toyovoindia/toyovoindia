import { z } from 'zod';
import { createOrderSchema } from './order.validator.js';

// Re-use order validation for PayU order creation
export const createPayuOrderSchema = createOrderSchema;
