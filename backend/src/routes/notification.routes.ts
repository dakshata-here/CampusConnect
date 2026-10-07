import { Router } from 'express';
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  broadcastNoticeEndpoint
} from '../controllers/notification.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { UserRole } from '../models/User.js';

const router = Router();

/**
 * 1. GET /api/notifications & GET /api/notifications/my
 * Access: Authenticated
 */
router.get('/', requireAuth, getMyNotifications);
router.get('/my', requireAuth, getMyNotifications);

/**
 * 2. GET /api/notifications/unread-count
 * Access: Authenticated
 */
router.get('/unread-count', requireAuth, getUnreadCount);

/**
 * 3. PATCH /api/notifications/mark-all-read
 * Access: Authenticated
 */
router.patch('/mark-all-read', requireAuth, markAllAsRead);

/**
 * 4. PATCH /api/notifications/:id/read
 * Access: Authenticated
 */
router.patch('/:id/read', requireAuth, markAsRead);

/**
 * 5. DELETE /api/notifications/:id
 * Access: Authenticated
 */
router.delete('/:id', requireAuth, deleteNotification);

/**
 * 6. POST /api/notifications/broadcast
 * Access: College Admin only
 */
router.post(
  '/broadcast',
  requireAuth,
  requireRole(UserRole.COLLEGE_ADMIN),
  broadcastNoticeEndpoint
);

export default router;
