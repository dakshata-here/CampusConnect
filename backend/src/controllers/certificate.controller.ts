import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Certificate } from '../models/Certificate.js';
import { Event } from '../models/Event.js';
import { UserRole } from '../models/User.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { issueCertificateForAttendee } from '../utils/certificateService.js';
import { isAuthorizedLeadOrAdmin } from './clubMembership.controller.js';

/**
 * GET /api/certificates/my
 * Access: Authenticated (Student, President, Admin)
 * Retrieves all certificates earned by the current user.
 */
export const getMyCertificates = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
      return;
    }

    const certificates = await Certificate.find({
      studentId: user._id
    })
      .populate('eventId', 'title eventType date startTime endTime posterUrl')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: certificates.length,
      certificates: certificates.map((c) => c.toJSON())
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/certificates/:id
 * Access: Authenticated
 * Retrieves a single certificate by MongoDB ID.
 */
export const getCertificateById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
      return;
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid certificate ID format.'
      });
      return;
    }

    const cert = await Certificate.findById(id).populate(
      'eventId',
      'title eventType date startTime endTime posterUrl clubId'
    );

    if (!cert) {
      res.status(404).json({
        success: false,
        message: 'Certificate not found.'
      });
      return;
    }

    // Authorization check: Students can only view their own certificates
    if (user.role === UserRole.STUDENT && cert.studentId.toString() !== user._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. You do not own this certificate.'
      });
      return;
    }

    res.status(200).json({
      success: true,
      certificate: cert.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/certificates/verify/:code
 * Access: Public (Anyone with certificate code can verify validity)
 * Verifies the authenticity of an institutional certificate by its code.
 */
export const verifyCertificateByCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { code } = req.params;

    if (!code || typeof code !== 'string' || !code.trim()) {
      res.status(400).json({
        success: false,
        message: 'Certificate code is required.'
      });
      return;
    }

    const cleanCode = code.trim().toUpperCase();
    const cert = await Certificate.findOne({
      certificateNumber: { $regex: `^${cleanCode}$`, $options: 'i' }
    }).populate('eventId', 'title eventType date venueId clubId');

    if (!cert) {
      res.status(404).json({
        success: false,
        valid: false,
        message: 'Certificate not found or invalid certificate code.'
      });
      return;
    }

    res.status(200).json({
      success: true,
      valid: true,
      message: 'Certificate verified as authentic and valid.',
      certificate: cert.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/certificates/events/:eventId
 * Access: College Admin OR active LEAD of hosting club
 * Retrieves all certificates issued for a specific event.
 */
export const getEventCertificates = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
      return;
    }

    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid event ID format.'
      });
      return;
    }

    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
      return;
    }

    if (user.role === UserRole.STUDENT) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. Students cannot view event certificate issuance rosters.'
      });
      return;
    }

    if (user.role === UserRole.CLUB_PRESIDENT) {
      if (!event.clubId) {
        res.status(403).json({
          success: false,
          message: 'Forbidden. Presidents cannot view certificates for events without an associated club.'
        });
        return;
      }

      const isLead = await isAuthorizedLeadOrAdmin(req, event.clubId);
      if (!isLead) {
        res.status(403).json({
          success: false,
          message: 'Forbidden. You are not an active lead of this club.'
        });
        return;
      }
    } else if (user.role !== UserRole.COLLEGE_ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. Unauthorized access.'
      });
      return;
    }

    const certificates = await Certificate.find({ eventId: event._id }).sort({ studentName: 1 });

    res.status(200).json({
      success: true,
      event: {
        id: event._id.toString(),
        title: event.title,
        date: event.date
      },
      count: certificates.length,
      certificates: certificates.map((c) => c.toJSON())
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/certificates/issue/:registrationId
 * Access: College Admin OR active LEAD of hosting club
 * Manually issues or regenerates a certificate for an attendee.
 */
export const issueCertificateManual = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
      return;
    }

    const { registrationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(registrationId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid registration ID format.'
      });
      return;
    }

    if (user.role === UserRole.STUDENT) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. Students cannot issue certificates.'
      });
      return;
    }

    const cert = await issueCertificateForAttendee(registrationId);
    if (!cert) {
      res.status(400).json({
        success: false,
        message: 'Cannot issue certificate. Registration not found or attendee status is not ATTENDED.'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Certificate issued successfully.',
      certificate: cert.toJSON()
    });
  } catch (error) {
    next(error);
  }
};
