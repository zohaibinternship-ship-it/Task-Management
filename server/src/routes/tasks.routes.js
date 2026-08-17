import { Router } from 'express';
import {
  createTask,
  updateTask,
  assignTask,
  cancelTask,
  listTasks,
  listMyTasks,
  getTask,
  getTaskHistory,
} from '../controllers/task.controller.js';
import { startTask, pauseTask, resumeTask, completeTask } from '../controllers/taskWorkflow.controller.js';
import { addTaskUpdate, listTaskUpdates } from '../controllers/taskUpdate.controller.js';
import {
  uploadAttachments,
  listAttachments,
  downloadAttachment,
  deleteAttachment,
} from '../controllers/taskAttachment.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { uploadTaskAttachments } from '../middleware/upload.js';
import {
  createTaskSchema,
  updateTaskSchema,
  assignTaskSchema,
  cancelTaskSchema,
  listTasksQuerySchema,
} from '../validators/task.validators.js';
import { createTaskUpdateSchema } from '../validators/taskUpdate.validators.js';

const router = Router();

router.use(authenticate);

// Employee-scoped — must be declared before the admin '/:id' routes so 'my' isn't
// swallowed as a task id.
router.get('/my', validate(listTasksQuerySchema, 'query'), listMyTasks);

// Shared read — ownership for employees is enforced inside the service.
router.get('/:id', getTask);
router.get('/:id/history', getTaskHistory);

// Admin / Super Admin only — task definition stays admin-controlled.
router.post('/', requireRole('admin', 'super_admin'), validate(createTaskSchema), createTask);
router.get('/', requireRole('admin', 'super_admin'), validate(listTasksQuerySchema, 'query'), listTasks);
router.patch('/:id', requireRole('admin', 'super_admin'), validate(updateTaskSchema), updateTask);
router.post('/:id/assign', requireRole('admin', 'super_admin'), validate(assignTaskSchema), assignTask);
router.post('/:id/cancel', requireRole('admin', 'super_admin'), validate(cancelTaskSchema), cancelTask);

// Employee workflow — only the assigned employee may drive their own task
// (ownership is re-checked inside the service, not just via role).
router.post('/:id/start', requireRole('employee'), startTask);
router.post('/:id/pause', requireRole('employee'), pauseTask);
router.post('/:id/resume', requireRole('employee'), resumeTask);
router.post('/:id/complete', requireRole('employee'), completeTask);

// Progress updates — employee posts, assigned employee + any admin/super_admin can read.
router.post('/:id/updates', requireRole('employee'), validate(createTaskUpdateSchema), addTaskUpdate);
router.get('/:id/updates', listTaskUpdates);

// Document attachments — only Admin/Super Admin can attach or remove files, any format;
// the assigned employee (plus any admin/super_admin) can view and download them.
router.post('/:id/attachments', requireRole('admin', 'super_admin'), uploadTaskAttachments, uploadAttachments);
router.get('/:id/attachments', listAttachments);
router.get('/:id/attachments/:attachmentId/download', downloadAttachment);
router.delete('/:id/attachments/:attachmentId', requireRole('admin', 'super_admin'), deleteAttachment);

export default router;
