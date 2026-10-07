import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Event, EventCategory, EventStatus, RegistrationMethod } from '../models/Event.js';
import { EventRegistration } from '../models/EventRegistration.js';
import { Approval, ApprovalAction } from '../models/Approval.js';
import { Club } from '../models/Club.js';
import { Venue } from '../models/Venue.js';
import { UserRole } from '../models/User.js';
import { isAuthorizedLeadOrAdmin } from './clubMembership.controller.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { generateEventRegistrationsPdf } from '../utils/registrationPdfService.js';

/**
 * POST /api/events
 * Access: College Admin OR President (Active LEAD of target club)
 * Creates a new event.
 */
export const createEvent = async (
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

    if (user.role === UserRole.STUDENT) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. Students are not authorized to create events.'
      });
      return;
    }

    const {
      title,
      eventType,
      category,
      shortDescription,
      description,
      agenda,
      posterTheme,
      posterUrl,
      date,
      startTime,
      endTime,
      venueId,
      clubId,
      maxParticipants,
      registrationRequired,
      registrationMethod,
      externalRegistrationUrl,
      externalRegistrationQrUrl,
      registrationDeadline,
      eligibility,
      requiredMaterials,
      contactPerson,
      contactEmail,
      contactPhone,
      status
    } = req.body;

    // 1. Validate required basic fields
    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({
        success: false,
        message: 'Event title is required.'
      });
      return;
    }

    if (!eventType || typeof eventType !== 'string' || !eventType.trim()) {
      res.status(400).json({
        success: false,
        message: 'Event type is required.'
      });
      return;
    }

    if (!category || !Object.values(EventCategory).includes(category)) {
      res.status(400).json({
        success: false,
        message: `Event category is required and must be one of: ${Object.values(EventCategory).join(', ')}`
      });
      return;
    }

    if (!date) {
      res.status(400).json({
        success: false,
        message: 'Event date is required.'
      });
      return;
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Invalid event date format.'
      });
      return;
    }

    if (!startTime || typeof startTime !== 'string' || !startTime.trim()) {
      res.status(400).json({
        success: false,
        message: 'Start time is required.'
      });
      return;
    }

    if (!endTime || typeof endTime !== 'string' || !endTime.trim()) {
      res.status(400).json({
        success: false,
        message: 'End time is required.'
      });
      return;
    }

    // 2. Validate category & club authorization
    let validatedClubId: mongoose.Types.ObjectId | null = null;

    if (category === EventCategory.CLUB) {
      if (!clubId) {
        res.status(400).json({
          success: false,
          message: 'Club ID is required for club events.'
        });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(clubId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid club ID format.'
        });
        return;
      }

      const club = await Club.findById(clubId);
      if (!club) {
        res.status(404).json({
          success: false,
          message: 'Referenced club not found.'
        });
        return;
      }

      // If user is president, must be active LEAD of this club
      if (user.role === UserRole.CLUB_PRESIDENT) {
        const isLead = await isAuthorizedLeadOrAdmin(req, clubId);
        if (!isLead) {
          res.status(403).json({
            success: false,
            message: 'Forbidden. You are not an active lead of this club.'
          });
          return;
        }
      }

      validatedClubId = new mongoose.Types.ObjectId(clubId);
    } else if (category === EventCategory.ACADEMIC) {
      // Presidents cannot create academic events unless they are college_admin
      if (user.role === UserRole.CLUB_PRESIDENT) {
        res.status(403).json({
          success: false,
          message: 'Forbidden. Presidents are only authorized to create club events.'
        });
        return;
      }

      // If clubId is supplied for academic event, validate if provided
      if (clubId) {
        if (!mongoose.Types.ObjectId.isValid(clubId)) {
          res.status(400).json({
            success: false,
            message: 'Invalid club ID format.'
          });
          return;
        }
        const club = await Club.findById(clubId);
        if (!club) {
          res.status(404).json({
            success: false,
            message: 'Referenced club not found.'
          });
          return;
        }
        validatedClubId = new mongoose.Types.ObjectId(clubId);
      }
    }

    // 3. Validate venue if provided
    let validatedVenueId: mongoose.Types.ObjectId | null = null;
    if (venueId) {
      if (!mongoose.Types.ObjectId.isValid(venueId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid venue ID format.'
        });
        return;
      }

      const venue = await Venue.findById(venueId);
      if (!venue) {
        res.status(404).json({
          success: false,
          message: 'Referenced venue not found.'
        });
        return;
      }

      validatedVenueId = new mongoose.Types.ObjectId(venueId);
    }

    // 4. Validate registrationMethod if provided
    if (registrationMethod && !Object.values(RegistrationMethod).includes(registrationMethod)) {
      res.status(400).json({
        success: false,
        message: `Invalid registration method. Must be one of: ${Object.values(RegistrationMethod).join(', ')}`
      });
      return;
    }

    // 5. Validate status if provided
    if (status && !Object.values(EventStatus).includes(status)) {
      res.status(400).json({
        success: false,
        message: `Invalid event status. Must be one of: ${Object.values(EventStatus).join(', ')}`
      });
      return;
    }

    // 6. Validate maxParticipants if provided
    if (maxParticipants !== undefined && maxParticipants !== null) {
      const numParticipants = Number(maxParticipants);
      if (isNaN(numParticipants) || numParticipants < 1) {
        res.status(400).json({
          success: false,
          message: 'Maximum participants must be at least 1.'
        });
        return;
      }
    }

    // 7. Instantiate and save Event with proposedBy set strictly from req.user._id
    const newEvent = new Event({
      title: title.trim(),
      eventType: eventType.trim(),
      category,
      shortDescription: shortDescription || '',
      description: description || '',
      agenda: agenda || '',
      posterTheme: posterTheme || '',
      posterUrl: posterUrl || '',
      date: parsedDate,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      venueId: validatedVenueId,
      clubId: validatedClubId,
      proposedBy: user._id, // Strictly derived from req.user
      maxParticipants: maxParticipants !== undefined && maxParticipants !== null ? Number(maxParticipants) : null,
      registrationRequired: Boolean(registrationRequired),
      registrationMethod: registrationMethod || RegistrationMethod.CAMPUSCONNECT,
      externalRegistrationUrl: externalRegistrationUrl || '',
      externalRegistrationQrUrl: externalRegistrationQrUrl || '',
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
      eligibility: eligibility || '',
      requiredMaterials: requiredMaterials || '',
      contactPerson: contactPerson || '',
      contactEmail: contactEmail || '',
      contactPhone: contactPhone || '',
      status: status || EventStatus.DRAFT
    });

    await newEvent.save();

    res.status(201).json({
      success: true,
      message: 'Event created successfully.',
      event: newEvent.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/events
 * Access: Authenticated (student, president, college_admin)
 * Returns list of events.
 */
export const getEvents = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const events = await Event.find()
      .populate('clubId', 'name shortName category status')
      .populate('venueId', 'name building floor capacity operationalStatus')
      .populate('proposedBy', 'name email role')
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      events: events.map((e) => e.toJSON())
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/events/:id
 * Access: Authenticated (student, president, college_admin)
 * Returns event details by ID.
 */
export const getEventById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid event ID format.'
      });
      return;
    }

    const event = await Event.findById(id)
      .populate('clubId', 'name shortName category status')
      .populate('venueId', 'name building floor capacity operationalStatus')
      .populate('proposedBy', 'name email role');

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
      return;
    }

    res.status(200).json({
      success: true,
      event: event.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/events/:id
 * Access: College Admin OR President (Active LEAD of event's club)
 * Updates an existing event.
 */
export const updateEvent = async (
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
        message: 'Invalid event ID format.'
      });
      return;
    }

    const event = await Event.findById(id);
    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
      return;
    }

    // Authorization check
    if (user.role === UserRole.STUDENT) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. Students are not authorized to update events.'
      });
      return;
    }

    if (user.role === UserRole.CLUB_PRESIDENT) {
      if (!event.clubId) {
        res.status(403).json({
          success: false,
          message: 'Forbidden. Presidents cannot update events without an associated club.'
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

      // Presidents cannot reassign an event to another club
      if (req.body.clubId && req.body.clubId !== event.clubId.toString()) {
        res.status(403).json({
          success: false,
          message: 'Forbidden. Cannot transfer event to another club.'
        });
        return;
      }
    }

    // If venueId is updated, validate it
    if (req.body.venueId !== undefined) {
      if (req.body.venueId === null || req.body.venueId === '') {
        event.venueId = null;
      } else {
        if (!mongoose.Types.ObjectId.isValid(req.body.venueId)) {
          res.status(400).json({
            success: false,
            message: 'Invalid venue ID format.'
          });
          return;
        }
        const venue = await Venue.findById(req.body.venueId);
        if (!venue) {
          res.status(404).json({
            success: false,
            message: 'Referenced venue not found.'
          });
          return;
        }
        event.venueId = new mongoose.Types.ObjectId(req.body.venueId);
      }
    }

    // If clubId is updated by college admin, validate it
    if (req.body.clubId !== undefined && user.role === UserRole.COLLEGE_ADMIN) {
      if (req.body.clubId === null || req.body.clubId === '') {
        event.clubId = null;
      } else {
        if (!mongoose.Types.ObjectId.isValid(req.body.clubId)) {
          res.status(400).json({
            success: false,
            message: 'Invalid club ID format.'
          });
          return;
        }
        const club = await Club.findById(req.body.clubId);
        if (!club) {
          res.status(404).json({
            success: false,
            message: 'Referenced club not found.'
          });
          return;
        }
        event.clubId = new mongoose.Types.ObjectId(req.body.clubId);
      }
    }

    // Validate enums if provided
    if (req.body.category !== undefined) {
      if (!Object.values(EventCategory).includes(req.body.category)) {
        res.status(400).json({
          success: false,
          message: `Invalid category. Must be one of: ${Object.values(EventCategory).join(', ')}`
        });
        return;
      }
      event.category = req.body.category;
    }

    if (req.body.registrationMethod !== undefined) {
      if (!Object.values(RegistrationMethod).includes(req.body.registrationMethod)) {
        res.status(400).json({
          success: false,
          message: `Invalid registration method. Must be one of: ${Object.values(RegistrationMethod).join(', ')}`
        });
        return;
      }
      event.registrationMethod = req.body.registrationMethod;
    }

    if (req.body.status !== undefined) {
      if (!Object.values(EventStatus).includes(req.body.status)) {
        res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${Object.values(EventStatus).join(', ')}`
        });
        return;
      }
      event.status = req.body.status;
    }

    if (req.body.date !== undefined) {
      const parsedDate = new Date(req.body.date);
      if (isNaN(parsedDate.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Invalid event date format.'
        });
        return;
      }
      event.date = parsedDate;
    }

    if (req.body.maxParticipants !== undefined) {
      if (req.body.maxParticipants === null || req.body.maxParticipants === '') {
        event.maxParticipants = null;
      } else {
        const num = Number(req.body.maxParticipants);
        if (isNaN(num) || num < 1) {
          res.status(400).json({
            success: false,
            message: 'Maximum participants must be at least 1.'
          });
          return;
        }
        event.maxParticipants = num;
      }
    }

    // Apply updateable string and boolean fields
    if (req.body.title !== undefined) event.title = req.body.title.trim();
    if (req.body.eventType !== undefined) event.eventType = req.body.eventType.trim();
    if (req.body.shortDescription !== undefined) event.shortDescription = req.body.shortDescription;
    if (req.body.description !== undefined) event.description = req.body.description;
    if (req.body.agenda !== undefined) event.agenda = req.body.agenda;
    if (req.body.posterTheme !== undefined) event.posterTheme = req.body.posterTheme;
    if (req.body.posterUrl !== undefined) event.posterUrl = req.body.posterUrl;
    if (req.body.startTime !== undefined) event.startTime = req.body.startTime.trim();
    if (req.body.endTime !== undefined) event.endTime = req.body.endTime.trim();
    if (req.body.registrationRequired !== undefined) event.registrationRequired = Boolean(req.body.registrationRequired);
    if (req.body.externalRegistrationUrl !== undefined) event.externalRegistrationUrl = req.body.externalRegistrationUrl;
    if (req.body.externalRegistrationQrUrl !== undefined) event.externalRegistrationQrUrl = req.body.externalRegistrationQrUrl;
    if (req.body.registrationDeadline !== undefined) {
      event.registrationDeadline = req.body.registrationDeadline ? new Date(req.body.registrationDeadline) : null;
    }
    if (req.body.eligibility !== undefined) event.eligibility = req.body.eligibility;
    if (req.body.requiredMaterials !== undefined) event.requiredMaterials = req.body.requiredMaterials;
    if (req.body.contactPerson !== undefined) event.contactPerson = req.body.contactPerson;
    if (req.body.contactEmail !== undefined) event.contactEmail = req.body.contactEmail;
    if (req.body.contactPhone !== undefined) event.contactPhone = req.body.contactPhone;
    if (req.body.rejectionReason !== undefined) event.rejectionReason = req.body.rejectionReason;
    if (req.body.changeComments !== undefined) event.changeComments = req.body.changeComments;

    // proposedBy cannot be modified
    // Save updated document
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Event updated successfully.',
      event: event.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/events/:id/cancel
 * Access: College Admin OR President (Active LEAD of event's club)
 * Cancels an event by setting status to CANCELLED without physically deleting the document.
 */
export const cancelEvent = async (
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
        message: 'Invalid event ID format.'
      });
      return;
    }

    const event = await Event.findById(id);
    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
      return;
    }

    // Authorization check
    if (user.role === UserRole.STUDENT) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. Students are not authorized to cancel events.'
      });
      return;
    }

    if (user.role === UserRole.CLUB_PRESIDENT) {
      if (!event.clubId) {
        res.status(403).json({
          success: false,
          message: 'Forbidden. Presidents cannot cancel events without an associated club.'
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
    }

    // Set status to CANCELLED
    event.status = EventStatus.CANCELLED;

    if (req.body && (req.body.reason || req.body.cancellationReason)) {
      event.changeComments = req.body.reason || req.body.cancellationReason;
    }

    await event.save();

    res.status(200).json({
      success: true,
      message: 'Event cancelled successfully.',
      event: event.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/events/:id/approve
 * Access: College Admin only
 * Approves an event and creates an Approval audit record.
 */
export const approveEvent = async (
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

    if (user.role !== UserRole.COLLEGE_ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. Only College Admins can approve events.'
      });
      return;
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid event ID format.'
      });
      return;
    }

    const event = await Event.findById(id);
    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
      return;
    }

    // Status transition validation
    if (event.status === EventStatus.CANCELLED) {
      res.status(400).json({
        success: false,
        message: 'Invalid status transition. Cannot approve a cancelled event.'
      });
      return;
    }

    if (event.status === EventStatus.COMPLETED) {
      res.status(400).json({
        success: false,
        message: 'Invalid status transition. Cannot approve a completed event.'
      });
      return;
    }

    if (event.status === EventStatus.APPROVED) {
      res.status(400).json({
        success: false,
        message: 'Event is already approved.'
      });
      return;
    }

    // Update event status
    event.status = EventStatus.APPROVED;
    const comments = req.body?.comments || '';
    if (comments) {
      event.changeComments = comments;
    }
    await event.save();

    // Create Approval record (action and reviewer identity strictly server-determined)
    const approval = new Approval({
      eventId: event._id,
      reviewedBy: user._id,
      action: ApprovalAction.APPROVED,
      comments: comments
    });
    await approval.save();

    res.status(200).json({
      success: true,
      message: 'Event approved successfully.',
      event: event.toJSON(),
      approval: approval.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/events/:id/reject
 * Access: College Admin only
 * Rejects an event and creates an Approval audit record.
 */
export const rejectEvent = async (
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

    if (user.role !== UserRole.COLLEGE_ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. Only College Admins can reject events.'
      });
      return;
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid event ID format.'
      });
      return;
    }

    const event = await Event.findById(id);
    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
      return;
    }

    // Status transition validation
    if (event.status === EventStatus.CANCELLED) {
      res.status(400).json({
        success: false,
        message: 'Invalid status transition. Cannot reject a cancelled event.'
      });
      return;
    }

    if (event.status === EventStatus.COMPLETED) {
      res.status(400).json({
        success: false,
        message: 'Invalid status transition. Cannot reject a completed event.'
      });
      return;
    }

    if (event.status === EventStatus.REJECTED) {
      res.status(400).json({
        success: false,
        message: 'Event is already rejected.'
      });
      return;
    }

    const comments = req.body?.reason || req.body?.rejectionReason || req.body?.comments || '';

    // Update event status
    event.status = EventStatus.REJECTED;
    if (comments) {
      event.rejectionReason = comments;
    }
    await event.save();

    // Create Approval record
    const approval = new Approval({
      eventId: event._id,
      reviewedBy: user._id,
      action: ApprovalAction.REJECTED,
      comments: comments
    });
    await approval.save();

    res.status(200).json({
      success: true,
      message: 'Event rejected successfully.',
      event: event.toJSON(),
      approval: approval.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/events/:id/request-changes
 * Access: College Admin only
 * Requests changes on an event and creates an Approval audit record.
 */
export const requestChangesEvent = async (
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

    if (user.role !== UserRole.COLLEGE_ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. Only College Admins can request changes on events.'
      });
      return;
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid event ID format.'
      });
      return;
    }

    const event = await Event.findById(id);
    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
      return;
    }

    // Status transition validation
    if (event.status === EventStatus.CANCELLED) {
      res.status(400).json({
        success: false,
        message: 'Invalid status transition. Cannot request changes for a cancelled event.'
      });
      return;
    }

    if (event.status === EventStatus.COMPLETED) {
      res.status(400).json({
        success: false,
        message: 'Invalid status transition. Cannot request changes for a completed event.'
      });
      return;
    }

    const comments = req.body?.comments || req.body?.changeComments || req.body?.reason || '';
    if (!comments || typeof comments !== 'string' || !comments.trim()) {
      res.status(400).json({
        success: false,
        message: 'Comments are required when requesting changes.'
      });
      return;
    }

    // Update event status
    event.status = EventStatus.CHANGES_REQUESTED;
    event.changeComments = comments.trim();
    await event.save();

    // Create Approval record
    const approval = new Approval({
      eventId: event._id,
      reviewedBy: user._id,
      action: ApprovalAction.CHANGES_REQUESTED,
      comments: comments.trim()
    });
    await approval.save();

    res.status(200).json({
      success: true,
      message: 'Changes requested for event successfully.',
      event: event.toJSON(),
      approval: approval.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/events/:id/approvals
 * Access: Authenticated (student, president, college_admin)
 * Returns the approval history records for an event.
 */
export const getEventApprovals = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid event ID format.'
      });
      return;
    }

    const event = await Event.findById(id);
    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
      return;
    }

    const approvals = await Approval.find({ eventId: event._id })
      .populate('reviewedBy', 'name email role')
      .sort({ reviewedAt: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: approvals.length,
      approvals: approvals.map((a) => a.toJSON())
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper to escape CSV values and protect against CSV formula injection.
 */
const escapeCsvValue = (val: any): string => {
  if (val === null || val === undefined) return '""';
  let str = String(val).trim();
  // Formula injection protection: if value starts with =, +, -, @, prepend a single quote
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }
  // Escape double quotes by doubling them
  return `"${str.replace(/"/g, '""')}"`;
};

/**
 * GET /api/events/:id/registrations
 * Access: College Admin OR President (Active LEAD of the event's club)
 * Returns the list of registered students for a particular event.
 * STRICTLY REGISTRATION ONLY - NO ATTENDANCE DATA.
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

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid event ID format.'
      });
      return;
    }

    const event = await Event.findById(id);
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
        message: 'Forbidden. Students are not authorized to view event registration records.'
      });
      return;
    }

    if (user.role === UserRole.CLUB_PRESIDENT) {
      if (!event.clubId) {
        res.status(403).json({
          success: false,
          message: 'Forbidden. Presidents cannot access event registrations for events without an associated club.'
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

    const sanitizedRegistrations = registrations.map((reg) => {
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
        registrationDate: reg.registrationDate
      };
    });

    res.status(200).json({
      success: true,
      count: sanitizedRegistrations.length,
      eventId: event.id,
      eventTitle: event.title,
      registrations: sanitizedRegistrations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/events/:id/registrations/download
 * Access: College Admin OR President (Active LEAD of the event's club)
 * Downloads the registered students documentation for a particular event as CSV.
 * STRICTLY REGISTRATION ONLY - NO ATTENDANCE DATA.
 */
export const downloadEventRegistrationsDocumentation = async (
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
        message: 'Invalid event ID format.'
      });
      return;
    }

    const event = await Event.findById(id);
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
        message: 'Forbidden. Students are not authorized to download event registration documentation.'
      });
      return;
    }

    if (user.role === UserRole.CLUB_PRESIDENT) {
      if (!event.clubId) {
        res.status(403).json({
          success: false,
          message: 'Forbidden. Presidents cannot download event registrations for events without an associated club.'
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

    const headers = [
      'Student Name',
      'PRN / Enrollment Number',
      'Email',
      'Department',
      'Year',
      'Phone',
      'Team Name',
      'Registration Date'
    ];

    const rows = registrations.map((reg) => {
      const studentUser = reg.studentId as any;
      const name = studentUser?.name || '';
      const enrollment = reg.studentEnrollment || studentUser?.enrollmentNumber || '';
      const email = studentUser?.email || '';
      const department = studentUser?.department || '';
      const year = studentUser?.year || '';
      const phone = studentUser?.phone || '';
      const teamName = reg.teamName || '';
      const regDate = reg.registrationDate ? new Date(reg.registrationDate).toISOString() : '';

      return [
        escapeCsvValue(name),
        escapeCsvValue(enrollment),
        escapeCsvValue(email),
        escapeCsvValue(department),
        escapeCsvValue(year),
        escapeCsvValue(phone),
        escapeCsvValue(teamName),
        escapeCsvValue(regDate)
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    const sanitizedTitle = event.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `Event_${sanitizedTitle}_Registered_Students_${timestamp}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/events/:id/registrations/download/pdf
 * Access: College Admin OR President (Active LEAD of the event's club)
 * Downloads the registered students documentation for a particular event as PDF.
 * STRICTLY REGISTRATION ONLY - NO ATTENDANCE DATA.
 */
export const downloadEventRegistrationsPdfDocumentation = async (
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
        message: 'Invalid event ID format.'
      });
      return;
    }

    const event = await Event.findById(id);
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
        message: 'Forbidden. Students are not authorized to download event registration documentation.'
      });
      return;
    }

    if (user.role === UserRole.CLUB_PRESIDENT) {
      if (!event.clubId) {
        res.status(403).json({
          success: false,
          message: 'Forbidden. Presidents cannot download event registrations for events without an associated club.'
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

    // Retrieve registrations
    const registrations = await EventRegistration.find({ eventId: event._id })
      .populate('studentId', 'name email enrollmentNumber department year phone')
      .sort({ registrationDate: 1, createdAt: 1 });

    let clubName = 'College / Department';
    if (event.clubId) {
      const club = await Club.findById(event.clubId);
      if (club) clubName = club.name;
    }

    let venueName = 'On Campus / TBD';
    if (event.venueId) {
      const venue = await Venue.findById(event.venueId);
      if (venue) venueName = venue.name;
    }

    const sanitizedTitle = event.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `CampusConnect_${sanitizedTitle}_Registered_Students.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const pdfDoc = generateEventRegistrationsPdf({
      event,
      clubName,
      venueName,
      registrations
    });

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    next(error);
  }
};



