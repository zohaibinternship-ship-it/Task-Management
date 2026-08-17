import { z } from 'zod';

export const listAuditLogsQuerySchema = z.object({
  action: z.string().trim().max(100).optional(),
  entityType: z.string().trim().max(100).optional(),
  actorId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});
