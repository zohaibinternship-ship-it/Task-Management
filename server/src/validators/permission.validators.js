import { z } from 'zod';

export const roleParamSchema = z.object({
  roleName: z.enum(['super_admin', 'admin', 'employee']),
});

export const permissionKeyBodySchema = z.object({
  key: z.string().trim().min(1),
});
