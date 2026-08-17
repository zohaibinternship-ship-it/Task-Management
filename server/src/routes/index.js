import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import employeesRoutes from './employees.routes.js';
import adminsRoutes from './admins.routes.js';
import tasksRoutes from './tasks.routes.js';
import auditLogsRoutes from './auditLogs.routes.js';
import permissionsRoutes from './permissions.routes.js';
import dashboardRoutes from './dashboard.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/employees', employeesRoutes);
router.use('/admins', adminsRoutes);
router.use('/tasks', tasksRoutes);
router.use('/audit-logs', auditLogsRoutes);
router.use('/permissions', permissionsRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
