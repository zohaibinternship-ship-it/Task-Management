import { z } from 'zod';

const priorityEnum = z.enum(['low', 'medium', 'high', 'critical']);
const qaStatusEnum = z.enum(['not_required', 'pending', 'in_review', 'passed', 'failed']);
const approvalStatusEnum = z.enum(['pending', 'approved', 'rejected']);

const dateField = z.coerce.date();
const linksField = z.array(z.string().trim().url('Each link must be a valid URL')).max(50).default([]);

export const createTaskSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(200),
    description: z.string().trim().max(5000).optional(),
    projectId: z.coerce.number().int().positive().optional(),
    assigneeId: z.string().uuid().optional(),
    startDate: dateField.optional(),
    expectedEndDate: dateField.optional(),
    deadline: dateField.optional(),
    expectedHours: z.coerce.number().nonnegative('Expected hours cannot be negative').optional(),
    priority: priorityEnum.default('medium'),
    referenceLinks: linksField.optional(),
  })
  .refine(
    (data) => !data.startDate || !data.expectedEndDate || data.expectedEndDate >= data.startDate,
    { message: 'Expected end date cannot be before the start date', path: ['expectedEndDate'] },
  )
  .refine((data) => !data.startDate || !data.deadline || data.deadline >= data.startDate, {
    message: 'Deadline cannot be before the start date',
    path: ['deadline'],
  });

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(5000).nullable().optional(),
    projectId: z.coerce.number().int().positive().nullable().optional(),
    startDate: dateField.nullable().optional(),
    expectedEndDate: dateField.nullable().optional(),
    deadline: dateField.nullable().optional(),
    expectedHours: z.coerce.number().nonnegative('Expected hours cannot be negative').nullable().optional(),
    priority: priorityEnum.optional(),
    referenceLinks: linksField.optional(),
    deliverableLinks: linksField.optional(),
    qaStatus: qaStatusEnum.optional(),
    qaReport: z.string().trim().max(5000).nullable().optional(),
    lineManagerApproval: approvalStatusEnum.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' });

export const assignTaskSchema = z.object({
  employeeId: z.string().uuid('Provide a valid employee id'),
});

export const cancelTaskSchema = z.object({
  reason: z.string().trim().max(1000).optional(),
});

export const listTasksQuerySchema = z.object({
  status: z.enum(['pending', 'in_progress', 'paused', 'completed', 'cancelled']).optional(),
  priority: priorityEnum.optional(),
  assigneeId: z.string().uuid().optional(),
  projectId: z.coerce.number().int().positive().optional(),
  overdue: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
