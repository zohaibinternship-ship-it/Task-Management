import { Router } from 'express';
import { getEmployeeDashboard, getAdminDashboard, getReports } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/authorize.js';

const router = Router();

router.use(authenticate);

router.get('/employee', requireRole('employee'), getEmployeeDashboard);
router.get('/admin', requireRole('admin', 'super_admin'), getAdminDashboard);
router.get('/reports', requireRole('admin', 'super_admin'), getReports);

export default router;
