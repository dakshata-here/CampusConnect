import { Router } from 'express';
import {
  getClubs,
  getClubById,
  createClub,
  updateClub,
  updateClubStatus
} from '../controllers/club.controller.js';
import {
  getClubMembers,
  getClubLead,
  addClubMember,
  updateClubMember,
  removeClubMember
} from '../controllers/clubMembership.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { UserRole } from '../models/User.js';

const router = Router();

/**
 * 1. GET /api/clubs
 * Access: Authenticated (student, president, college_admin)
 */
router.get('/', requireAuth, getClubs);

/**
 * 2. GET /api/clubs/:id
 * Access: Authenticated (student, president, college_admin)
 */
router.get('/:id', requireAuth, getClubById);

/**
 * 3. POST /api/clubs
 * Access: College Admin only
 */
router.post('/', requireAuth, requireRole(UserRole.COLLEGE_ADMIN), createClub);

/**
 * 4. PUT /api/clubs/:id
 * Access: College Admin only
 */
router.put('/:id', requireAuth, requireRole(UserRole.COLLEGE_ADMIN), updateClub);

/**
 * 5. PATCH /api/clubs/:id/status
 * Access: College Admin only
 */
router.patch('/:id/status', requireAuth, requireRole(UserRole.COLLEGE_ADMIN), updateClubStatus);

// ==========================================
// Club Membership & Lead Management Routes
// ==========================================

/**
 * 6. GET /api/clubs/:clubId/members
 * Access: Authenticated (student, president, college_admin)
 */
router.get('/:clubId/members', requireAuth, getClubMembers);

/**
 * 7. GET /api/clubs/:clubId/lead
 * Access: Authenticated (student, president, college_admin)
 */
router.get('/:clubId/lead', requireAuth, getClubLead);

/**
 * 8. POST /api/clubs/:clubId/members
 * Access: College Admin OR active LEAD of target club
 */
router.post('/:clubId/members', requireAuth, addClubMember);

/**
 * 9. PATCH /api/clubs/:clubId/members/:userId
 * Access: College Admin OR active LEAD of target club
 */
router.patch('/:clubId/members/:userId', requireAuth, updateClubMember);

/**
 * 10. DELETE /api/clubs/:clubId/members/:userId
 * Access: College Admin OR active LEAD of target club
 */
router.delete('/:clubId/members/:userId', requireAuth, removeClubMember);

export default router;

