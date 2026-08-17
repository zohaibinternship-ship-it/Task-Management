import { Router } from 'express';
import { login, logout, me, changePassword } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/authorize.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, changePasswordSchema } from '../validators/auth.validators.js';

const router = Router();

router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);
router.post('/change-password', authenticate, requireRole('super_admin'), validate(changePasswordSchema), changePassword);

export default router;
