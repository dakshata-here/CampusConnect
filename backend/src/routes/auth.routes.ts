import { Router, Response } from 'express';
import { register, login, getMe, logout } from '../controllers/auth.controller.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = Router();

// ==========================================
// Authentication Routes
// ==========================================
router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.post('/logout', logout);

// ==========================================
// Role-Based Access Control (RBAC) Test Routes
// ==========================================
router.get('/test/admin', requireAuth, requireRole('college_admin'), (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Authorized: College Admin access granted.',
    user: req.user?.toJSON()
  });
});

router.get('/test/president', requireAuth, requireRole('president'), (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Authorized: Club President access granted.',
    user: req.user?.toJSON()
  });
});

router.get('/test/student', requireAuth, requireRole('student'), (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Authorized: Student access granted.',
    user: req.user?.toJSON()
  });
});

export default router;
