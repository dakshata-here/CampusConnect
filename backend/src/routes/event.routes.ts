import { Router } from 'express';
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  cancelEvent,
  approveEvent,
  rejectEvent,
  requestChangesEvent,
  getEventApprovals
} from '../controllers/event.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { UserRole } from '../models/User.js';

const router = Router();

/**
 * 1. GET /api/events
 * Access: Authenticated (student, president, college_admin)
 */
router.get('/', requireAuth, getEvents);

/**
 * 2. GET /api/events/:id
 * Access: Authenticated (student, president, college_admin)
 */
router.get('/:id', requireAuth, getEventById);

/**
 * 3. POST /api/events
 * Access: College Admin OR President (Active Club Lead)
 */
router.post(
  '/',
  requireAuth,
  requireRole(UserRole.COLLEGE_ADMIN, UserRole.CLUB_PRESIDENT),
  createEvent
);

/**
 * 4. PUT /api/events/:id
 * Access: College Admin OR President (Active Club Lead of the event's club)
 */
router.put(
  '/:id',
  requireAuth,
  requireRole(UserRole.COLLEGE_ADMIN, UserRole.CLUB_PRESIDENT),
  updateEvent
);

/**
 * 5. PATCH /api/events/:id/cancel
 * Access: College Admin OR President (Active Club Lead of the event's club)
 */
router.patch(
  '/:id/cancel',
  requireAuth,
  requireRole(UserRole.COLLEGE_ADMIN, UserRole.CLUB_PRESIDENT),
  cancelEvent
);

// ==========================================
// Admin Approval / Review Workflow Routes
// ==========================================

/**
 * 6. PATCH /api/events/:id/approve
 * Access: College Admin only
 */
router.patch(
  '/:id/approve',
  requireAuth,
  requireRole(UserRole.COLLEGE_ADMIN),
  approveEvent
);

/**
 * 7. PATCH /api/events/:id/reject
 * Access: College Admin only
 */
router.patch(
  '/:id/reject',
  requireAuth,
  requireRole(UserRole.COLLEGE_ADMIN),
  rejectEvent
);

/**
 * 8. PATCH /api/events/:id/request-changes
 * Access: College Admin only
 */
router.patch(
  '/:id/request-changes',
  requireAuth,
  requireRole(UserRole.COLLEGE_ADMIN),
  requestChangesEvent
);

/**
 * 9. GET /api/events/:id/approvals
 * Access: Authenticated (student, president, college_admin)
 */
router.get('/:id/approvals', requireAuth, getEventApprovals);

export default router;

