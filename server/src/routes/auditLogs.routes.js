import { Router } from 'express';
import { listAuditLogs, listMyAuditLogs } from '../controllers/auditLog.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { listAuditLogsQuerySchema } from '../validators/auditLog.validators.js';

const router = Router();

router.use(authenticate);

// Any authenticated user can see their own activity history.
router.get('/me', validate(listAuditLogsQuerySchema, 'query'), listMyAuditLogs);

router.get('/', requireRole('admin', 'super_admin'), validate(listAuditLogsQuerySchema, 'query'), listAuditLogs);

export default router;
