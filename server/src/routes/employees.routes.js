import { Router } from 'express';
import {
  createEmployee,
  listEmployees,
  getEmployee,
  setEmployeeStatus,
  updateEmployeeCredentials,
  deleteEmployee,
} from '../controllers/employee.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { createUserSchema, updateStatusSchema, listUsersQuerySchema, updateUserCredentialsSchema } from '../validators/user.validators.js';

const router = Router();

router.use(authenticate, requireRole('admin', 'super_admin'));

router.post('/', validate(createUserSchema), createEmployee);
router.get('/', validate(listUsersQuerySchema, 'query'), listEmployees);
router.get('/:id', getEmployee);
router.patch('/:id/status', validate(updateStatusSchema), setEmployeeStatus);

// Only Super Admin can update employee credentials or delete an employee account
router.patch('/:id/credentials', requireRole('super_admin'), validate(updateUserCredentialsSchema), updateEmployeeCredentials);
router.delete('/:id', requireRole('super_admin'), deleteEmployee);

export default router;
