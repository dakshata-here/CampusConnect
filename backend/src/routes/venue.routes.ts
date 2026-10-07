import { Router } from 'express';
import {
  getVenues,
  getVenueById,
  getVenueSchedule,
  checkConflict,
  createVenue,
  updateVenue,
  updateVenueStatus,
  deleteVenue
} from '../controllers/venue.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { UserRole } from '../models/User.js';

const router = Router();

/**
 * 1. GET /api/venues
 * Access: Authenticated (student, president, college_admin)
 */
router.get('/', requireAuth, getVenues);

/**
 * 2. POST /api/venues/check-conflict
 * Access: Authenticated (student, president, college_admin)
 */
router.post('/check-conflict', requireAuth, checkConflict);

/**
 * 3. GET /api/venues/:id
 * Access: Authenticated (student, president, college_admin)
 */
router.get('/:id', requireAuth, getVenueById);

/**
 * 4. GET /api/venues/:id/schedule
 * Access: Authenticated (student, president, college_admin)
 */
router.get('/:id/schedule', requireAuth, getVenueSchedule);

/**
 * 5. POST /api/venues
 * Access: College Admin only
 */
router.post('/', requireAuth, requireRole(UserRole.COLLEGE_ADMIN), createVenue);

/**
 * 6. PUT /api/venues/:id
 * Access: College Admin only
 */
router.put('/:id', requireAuth, requireRole(UserRole.COLLEGE_ADMIN), updateVenue);

/**
 * 7. PATCH /api/venues/:id/status
 * Access: College Admin only
 */
router.patch('/:id/status', requireAuth, requireRole(UserRole.COLLEGE_ADMIN), updateVenueStatus);

/**
 * 8. DELETE /api/venues/:id
 * Access: College Admin only
 */
router.delete('/:id', requireAuth, requireRole(UserRole.COLLEGE_ADMIN), deleteVenue);

export default router;
