import { Router } from 'express';
import { createAdmin, listAdmins, getAdmin, setAdminStatus, updateAdminCredentials, deleteAdmin } from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { createUserSchema, updateStatusSchema, listUsersQuerySchema } from '../validators/user.validators.js';
import { updateUserCredentialsSchema } from '../validators/user.validators.js';

const router = Router();

// Super Admin only — an Admin must never be able to create or disable other Admins.
router.use(authenticate, requireRole('super_admin'));

router.post('/', validate(createUserSchema), createAdmin);
router.get('/', validate(listUsersQuerySchema, 'query'), listAdmins);
router.get('/:id', getAdmin);
router.patch('/:id/status', validate(updateStatusSchema), setAdminStatus);
router.patch('/:id/credentials', validate(updateUserCredentialsSchema), updateAdminCredentials);
router.delete('/:id', deleteAdmin);

export default router;
