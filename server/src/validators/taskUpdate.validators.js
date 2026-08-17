import { z } from 'zod';

export const createTaskUpdateSchema = z.object({
  message: z.string().trim().min(1, 'Update message cannot be empty').max(2000),
});
