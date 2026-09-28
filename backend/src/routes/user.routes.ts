import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  getAllUsers
} from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { UserRole } from '../models/User.js';

const router = Router();

/**
 * 1. GET /api/users/profile
 * Returns the authenticated user's sanitized profile.
 */
router.get('/profile', requireAuth, getProfile);

/**
 * 2. PUT /api/users/profile
 * Updates permitted profile fields for the authenticated user.
 */
router.put('/profile', requireAuth, updateProfile);

/**
 * 3. GET /api/users
 * Returns sanitized list of users (Admin only).
 */
router.get(
  '/',
  requireAuth,
  requireRole(UserRole.COLLEGE_ADMIN),
  getAllUsers
);

export default router;
