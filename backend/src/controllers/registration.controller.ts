import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Event, EventStatus, RegistrationMethod } from '../models/Event.js';
import {
  EventRegistration,
  RegistrationAttendanceStatus,
  IEventRegistration
} from '../models/EventRegistration.js';
import { UserRole } from '../models/User.js';
import { isAuthorizedLeadOrAdmin } from './clubMembership.controller.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

/**
 * POST /api/registrations/events/:eventId
 * Access: Authenticated (student, president, college_admin)
 * Registers the authenticated user for an approved event.
 */
export const registerForEvent = async (
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

    // 1. Event must be in APPROVED status to accept registrations
    if (event.status !== EventStatus.APPROVED) {
      res.status(400).json({
        success: false,
        message: `Cannot register for this event. Event must be APPROVED (Current status: ${event.status}).`
      });
      return;
    }

    // 2. Check if registration is required
    if (event.registrationRequired === false) {
      res.status(400).json({
        success: false,
        message: 'Registration is not required for this event.'
      });
      return;
    }

    // 3. Prevent duplicate registration
    const existingRegistration = await EventRegistration.findOne({
      eventId: event._id,
      studentId: user._id
    });

    if (existingRegistration) {
      res.status(409).json({
        success: false,
        message: 'You are already registered for this event.'
      });
      return;
    }

    // 4. Enforce capacity limits if configured
    if (event.maxParticipants && event.maxParticipants > 0) {
      const activeRegistrationsCount = await EventRegistration.countDocuments({
        eventId: event._id
      });

      if (activeRegistrationsCount >= event.maxParticipants) {
        res.status(409).json({
          success: false,
          message: 'Registration is full. Maximum capacity reached.'
        });
        return;
      }
    }

    // 5. Create new registration linked to authenticated student
    const { teamName } = req.body || {};

    const registration = new EventRegistration({
      eventId: event._id,
      studentId: user._id,
      studentEnrollment: user.enrollmentNumber || 'N/A',
      teamName: typeof teamName === 'string' ? teamName.trim() : '',
      attendanceStatus: RegistrationAttendanceStatus.REGISTERED,
      registrationDate: new Date(),
      attendedAt: null
    });

    await registration.save();

    res.status(201).json({
      success: true,
      message: 'Registered for event successfully.',
      registration: {
        id: registration.id,
        eventId: event._id,
        studentId: user._id,
        studentName: user.name,
        studentEmail: user.email,
        studentEnrollment: registration.studentEnrollment,
        department: user.department || '',
        year: user.year || '',
        phone: user.phone || '',
        teamName: registration.teamName,
        registrationDate: registration.registrationDate,
        attendanceStatus: registration.attendanceStatus,
        attendedAt: registration.attendedAt,
        qrCodeData: registration.id.toString()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/registrations/my
 * Access: Authenticated (student, president, college_admin)
 * Retrieves the current authenticated user's registrations and QR passes.
 */
export const getMyRegistrations = async (
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

    const registrations = await EventRegistration.find({ studentId: user._id })
      .populate({
        path: 'eventId',
        populate: [
          { path: 'clubId', select: 'name shortName category status' },
          { path: 'venueId', select: 'name building floor capacity operationalStatus' }
        ]
      })
      .sort({ registrationDate: -1, createdAt: -1 });

    const formatted = registrations.map((reg) => ({
      id: reg.id,
      eventId: reg.eventId,
      studentId: user._id.toString(),
      studentName: user.name,
      studentEmail: user.email,
      studentEnrollment: reg.studentEnrollment || user.enrollmentNumber || '',
      department: user.department || '',
      year: user.year || '',
      phone: user.phone || '',
      teamName: reg.teamName || '',
      attendanceStatus: reg.attendanceStatus,
      attendedAt: reg.attendedAt,
      registrationDate: reg.registrationDate,
      qrCodeData: reg.id.toString(),
      createdAt: reg.createdAt,
      updatedAt: reg.updatedAt
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      registrations: formatted
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/registrations/events/:eventId
 * Access: College Admin OR President (Active LEAD of the event's club)
 * Retrieves full attendee roster and live statistics for a specific event.
 */
export const getEventRegistrations = async (
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

    // Role & Authorization Check
    if (user.role === UserRole.STUDENT) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. Students are not authorized to view event attendee records.'
      });
      return;
    }

    if (user.role === UserRole.CLUB_PRESIDENT) {
      if (!event.clubId) {
        res.status(403).json({
          success: false,
          message: 'Forbidden. Presidents cannot access attendee rosters for events without an associated club.'
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

    const registrations = await EventRegistration.find({ eventId: event._id })
      .populate('studentId', 'name email enrollmentNumber department year phone')
      .sort({ registrationDate: 1, createdAt: 1 });

    const totalActive = registrations.length;
    const totalAttended = registrations.filter(
      (r) => r.attendanceStatus === RegistrationAttendanceStatus.ATTENDED
    ).length;
    const totalNotAttended = registrations.filter(
      (r) => r.attendanceStatus === RegistrationAttendanceStatus.NOT_ATTENDED
    ).length;
    const totalRegistered = registrations.filter(
      (r) => r.attendanceStatus === RegistrationAttendanceStatus.REGISTERED
    ).length;
    const attendanceRate = totalActive > 0 ? Math.round((totalAttended / totalActive) * 100) : 0;

    const formattedRegistrations = registrations.map((reg) => {
      const studentUser = reg.studentId as any;
      return {
        id: reg.id,
        eventId: reg.eventId,
        studentId: studentUser?._id ? studentUser._id.toString() : reg.studentId.toString(),
        studentName: studentUser?.name || '',
        studentEmail: studentUser?.email || '',
        studentEnrollment: reg.studentEnrollment || studentUser?.enrollmentNumber || '',
        department: studentUser?.department || '',
        year: studentUser?.year || '',
        phone: studentUser?.phone || '',
        teamName: reg.teamName || '',
        attendanceStatus: reg.attendanceStatus,
        attendedAt: reg.attendedAt,
        registrationDate: reg.registrationDate,
        qrCodeData: reg.id.toString()
      };
    });

    res.status(200).json({
      success: true,
      eventId: event.id,
      eventTitle: event.title,
      stats: {
        totalActive,
        totalAttended,
        totalNotAttended,
        totalRegistered,
        attendanceRate
      },
      count: formattedRegistrations.length,
      registrations: formattedRegistrations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/registrations/scan-qr
 * Access: College Admin OR President (Active LEAD of the event's club)
 * Scans a QR ticket and marks attendance as ATTENDED.
 */
export const scanQrCode = async (
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

    const { qrCodeData, eventId } = req.body || {};

    if (!qrCodeData || typeof qrCodeData !== 'string' || !qrCodeData.trim()) {
      res.status(400).json({
        success: false,
        message: 'QR code data is required.'
      });
      return;
    }

    let targetRegId = qrCodeData.trim();
    if (targetRegId.startsWith('{')) {
      try {
        const parsed = JSON.parse(targetRegId);
        targetRegId = parsed.registrationId || parsed.id || targetRegId;
      } catch {
        // use raw string
      }
    }

    if (!mongoose.Types.ObjectId.isValid(targetRegId)) {
      res.status(404).json({
        success: false,
        message: 'Registration ticket not found or invalid QR code.'
      });
      return;
    }

    const registration = await EventRegistration.findById(targetRegId)
      .populate('eventId')
      .populate('studentId', 'name email enrollmentNumber department year phone');

    if (!registration) {
      res.status(404).json({
        success: false,
        message: 'Registration ticket not found or invalid QR code.'
      });
      return;
    }

    const event = registration.eventId as any;
    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Associated event not found for this ticket.'
      });
      return;
    }

    // Optional event ID matching
    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      if (event._id.toString() !== eventId.toString()) {
        res.status(400).json({
          success: false,
          message: 'QR ticket does not match the specified event.'
        });
        return;
      }
    }

    // Role & Authorization Check
    if (user.role === UserRole.STUDENT) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. Students are not authorized to scan QR attendance codes.'
      });
      return;
    }

    if (user.role === UserRole.CLUB_PRESIDENT) {
      if (!event.clubId) {
        res.status(403).json({
          success: false,
          message: 'Forbidden. Presidents cannot scan tickets for events without an associated club.'
        });
        return;
      }

      const isLead = await isAuthorizedLeadOrAdmin(req, event.clubId);
      if (!isLead) {
        res.status(403).json({
          success: false,
          message: 'Forbidden. You are not an active lead of the event hosting club.'
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

    // Duplicate check-in prevention
    if (registration.attendanceStatus === RegistrationAttendanceStatus.ATTENDED) {
      res.status(409).json({
        success: false,
        message: 'Attendee is ALREADY marked present.',
        registration: {
          id: registration.id,
          eventId: event._id,
          attendanceStatus: registration.attendanceStatus,
          attendedAt: registration.attendedAt
        }
      });
      return;
    }

    // Mark present
    registration.attendanceStatus = RegistrationAttendanceStatus.ATTENDED;
    registration.attendedAt = new Date();
    await registration.save();

    const studentUser = registration.studentId as any;

    res.status(200).json({
      success: true,
      message: 'Attendance verified and recorded successfully.',
      registration: {
        id: registration.id,
        eventId: event._id,
        studentId: studentUser?._id ? studentUser._id.toString() : registration.studentId.toString(),
        studentName: studentUser?.name || '',
        studentEmail: studentUser?.email || '',
        studentEnrollment: registration.studentEnrollment,
        department: studentUser?.department || '',
        year: studentUser?.year || '',
        phone: studentUser?.phone || '',
        teamName: registration.teamName,
        attendanceStatus: registration.attendanceStatus,
        attendedAt: registration.attendedAt,
        qrCodeData: registration.id.toString()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/registrations/:id/attendance
 * Access: College Admin OR President (Active LEAD of the event's club)
 * Manually updates the attendance status of a registration.
 */
export const updateAttendanceStatus = async (
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
    const { status } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid registration ID format.'
      });
      return;
    }

    const upperStatus = typeof status === 'string' ? status.toUpperCase() : '';
    if (!Object.values(RegistrationAttendanceStatus).includes(upperStatus as any)) {
      res.status(400).json({
        success: false,
        message: `Invalid attendance status. Must be one of: ${Object.values(
          RegistrationAttendanceStatus
        ).join(', ')}`
      });
      return;
    }

    const registration = await EventRegistration.findById(id)
      .populate('eventId')
      .populate('studentId', 'name email enrollmentNumber department year phone');

    if (!registration) {
      res.status(404).json({
        success: false,
        message: 'Registration record not found.'
      });
      return;
    }

    const event = registration.eventId as any;
    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Associated event not found.'
      });
      return;
    }

    // Role & Authorization Check
    if (user.role === UserRole.STUDENT) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. Students are not authorized to update attendance records.'
      });
      return;
    }

    if (user.role === UserRole.CLUB_PRESIDENT) {
      if (!event.clubId) {
        res.status(403).json({
          success: false,
          message: 'Forbidden. Presidents cannot update attendance for events without an associated club.'
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

    registration.attendanceStatus = upperStatus as RegistrationAttendanceStatus;
    if (upperStatus === RegistrationAttendanceStatus.ATTENDED) {
      registration.attendedAt = new Date();
    } else {
      registration.attendedAt = null;
    }

    await registration.save();

    const studentUser = registration.studentId as any;

    res.status(200).json({
      success: true,
      message: 'Attendance status updated successfully.',
      registration: {
        id: registration.id,
        eventId: event._id,
        studentId: studentUser?._id ? studentUser._id.toString() : registration.studentId.toString(),
        studentName: studentUser?.name || '',
        studentEmail: studentUser?.email || '',
        studentEnrollment: registration.studentEnrollment,
        teamName: registration.teamName,
        attendanceStatus: registration.attendanceStatus,
        attendedAt: registration.attendedAt,
        qrCodeData: registration.id.toString()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/registrations/:id
 * Access: Authenticated (Student owner, President of hosting club, or College Admin)
 * Cancels and deletes an active registration.
 */
export const cancelRegistration = async (
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
        message: 'Invalid registration ID format.'
      });
      return;
    }

    const registration = await EventRegistration.findById(id).populate('eventId');
    if (!registration) {
      res.status(404).json({
        success: false,
        message: 'Registration record not found.'
      });
      return;
    }

    const isOwner = registration.studentId.toString() === user._id.toString();
    const isAdmin = user.role === UserRole.COLLEGE_ADMIN;
    let isLead = false;

    if (user.role === UserRole.CLUB_PRESIDENT && registration.eventId) {
      const event = registration.eventId as any;
      if (event.clubId) {
        isLead = await isAuthorizedLeadOrAdmin(req, event.clubId);
      }
    }

    if (!isOwner && !isAdmin && !isLead) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. You are not authorized to cancel this registration.'
      });
      return;
    }

    await EventRegistration.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Registration cancelled successfully.',
      registration: {
        id: registration.id,
        eventId: registration.eventId,
        studentId: registration.studentId,
        studentEnrollment: registration.studentEnrollment,
        attendanceStatus: 'CANCELLED'
      }
    });
  } catch (error) {
    next(error);
  }
};
