import { Router } from 'express';
import {
  getClubMembers,
  getClubLead,
  addClubMember,
  updateClubMember,
  removeClubMember
} from '../controllers/clubMembership.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router({ mergeParams: true });

/**
 * 1. GET /api/clubs/:clubId/members
 * Access: Authenticated (student, president, college_admin)
 */
router.get('/', requireAuth, getClubMembers);

/**
 * 2. GET /api/clubs/:clubId/lead
 * Access: Authenticated (student, president, college_admin)
 */
router.get('/lead', requireAuth, getClubLead);

/**
 * 3. POST /api/clubs/:clubId/members
 * Access: College Admin OR active LEAD of this club
 */
router.post('/', requireAuth, addClubMember);

/**
 * 4. PATCH /api/clubs/:clubId/members/:userId
 * Access: College Admin OR active LEAD of this club
 */
router.patch('/:userId', requireAuth, updateClubMember);

/**
 * 5. DELETE /api/clubs/:clubId/members/:userId
 * Access: College Admin OR active LEAD of this club
 */
router.delete('/:userId', requireAuth, removeClubMember);

export default router;
