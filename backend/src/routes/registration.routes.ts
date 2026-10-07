import { Router } from 'express';
import {
  registerForEvent,
  getMyRegistrations,
  getEventRegistrations,
  scanQrCode,
  updateAttendanceStatus,
  cancelRegistration
} from '../controllers/registration.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { UserRole } from '../models/User.js';

const router = Router();

/**
 * 1. POST /api/registrations/events/:eventId
 * Access: Authenticated (student, president, college_admin)
 */
router.post('/events/:eventId', requireAuth, registerForEvent);

/**
 * 2. GET /api/registrations/my
 * Access: Authenticated (User's personal registrations & QR passes)
 */
router.get('/my', requireAuth, getMyRegistrations);

/**
 * 3. GET /api/registrations/events/:eventId
 * Access: College Admin OR active LEAD of the hosting club
 */
router.get(
  '/events/:eventId',
  requireAuth,
  requireRole(UserRole.COLLEGE_ADMIN, UserRole.CLUB_PRESIDENT),
  getEventRegistrations
);

/**
 * 4. POST /api/registrations/scan-qr
 * Access: College Admin OR active LEAD of the hosting club
 */
router.post(
  '/scan-qr',
  requireAuth,
  requireRole(UserRole.COLLEGE_ADMIN, UserRole.CLUB_PRESIDENT),
  scanQrCode
);

/**
 * 5. PATCH /api/registrations/:id/attendance
 * Access: College Admin OR active LEAD of the hosting club
 */
router.patch(
  '/:id/attendance',
  requireAuth,
  requireRole(UserRole.COLLEGE_ADMIN, UserRole.CLUB_PRESIDENT),
  updateAttendanceStatus
);

/**
 * 6. DELETE /api/registrations/:id
 * Access: Authenticated (Student owner or College Admin)
 */
router.delete('/:id', requireAuth, cancelRegistration);

export default router;
