import { Router } from 'express';
import {
  getMyCertificates,
  getCertificateById,
  verifyCertificateByCode,
  getEventCertificates,
  issueCertificateManual
} from '../controllers/certificate.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { UserRole } from '../models/User.js';

const router = Router();

/**
 * 1. GET /api/certificates/verify/:code
 * Access: Public (Anyone can verify certificate authenticity)
 */
router.get('/verify/:code', verifyCertificateByCode);

/**
 * 2. GET /api/certificates/my
 * Access: Authenticated (Student, President, Admin)
 */
router.get('/my', requireAuth, getMyCertificates);

/**
 * 3. GET /api/certificates/events/:eventId
 * Access: College Admin OR active LEAD of hosting club
 */
router.get(
  '/events/:eventId',
  requireAuth,
  requireRole(UserRole.COLLEGE_ADMIN, UserRole.CLUB_PRESIDENT),
  getEventCertificates
);

/**
 * 4. GET /api/certificates/:id
 * Access: Authenticated
 */
router.get('/:id', requireAuth, getCertificateById);

/**
 * 5. POST /api/certificates/issue/:registrationId
 * Access: College Admin OR active LEAD of hosting club
 */
router.post(
  '/issue/:registrationId',
  requireAuth,
  requireRole(UserRole.COLLEGE_ADMIN, UserRole.CLUB_PRESIDENT),
  issueCertificateManual
);

export default router;
