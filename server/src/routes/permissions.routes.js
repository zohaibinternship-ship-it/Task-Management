import { Router } from 'express';
import {
  listPermissions,
  listRolePermissions,
  grantRolePermission,
  revokeRolePermission,
} from '../controllers/permission.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { roleParamSchema, permissionKeyBodySchema } from '../validators/permission.validators.js';

const router = Router();

// Super Admin only — permission management is itself a Super-Admin-level capability.
router.use(authenticate, requireRole('super_admin'));

router.get('/', listPermissions);
router.get('/roles/:roleName', validate(roleParamSchema, 'params'), listRolePermissions);
router.post(
  '/roles/:roleName',
  validate(roleParamSchema, 'params'),
  validate(permissionKeyBodySchema),
  grantRolePermission,
);
router.delete('/roles/:roleName/:key', validate(roleParamSchema, 'params'), revokeRolePermission);

export default router;
