import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const updateStatusSchema = z.object({
  isActive: z.boolean(),
});

export const listUsersQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// For Super Admin to update user credentials (email, name, password)
export const updateUserCredentialsSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Enter a valid email address').optional(),
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120).optional(),
    password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  })
  .refine((data) => data.email || data.name || data.password, {
    message: 'At least one field (email, name, or password) must be provided',
  });
