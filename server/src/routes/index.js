import { Router } from 'express';
import healthRoutes from './health.routes.js';

const router = Router();

router.use('/health', healthRoutes);

// Additional route modules (auth, employees, admins, tasks, etc.) are mounted
// here as they are implemented in later phases.

export default router;
