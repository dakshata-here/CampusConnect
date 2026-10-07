import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Venue, VenueOperationalStatus } from '../models/Venue.js';
import { Event, EventStatus } from '../models/Event.js';
import { UserRole } from '../models/User.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import {
  checkVenueConflict,
  formatToDateString,
  isSameCalendarDay
} from '../utils/venueConflict.js';

/**
 * GET /api/venues
 * Access: Authenticated (student, president, college_admin)
 * Retrieves all venues with optional filters.
 */
export const getVenues = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search, operationalStatus, isAvailable, minCapacity } = req.query;

    const query: any = {};

    if (search && typeof search === 'string') {
      const trimmed = search.trim();
      query.$or = [
        { name: { $regex: trimmed, $options: 'i' } },
        { building: { $regex: trimmed, $options: 'i' } }
      ];
    }

    if (operationalStatus && typeof operationalStatus === 'string') {
      if (Object.values(VenueOperationalStatus).includes(operationalStatus as VenueOperationalStatus)) {
        query.operationalStatus = operationalStatus;
      }
    }

    if (isAvailable !== undefined) {
      const isAvailStr = String(isAvailable).toLowerCase();
      if (isAvailStr === 'true') {
        query.isAvailable = true;
      } else if (isAvailStr === 'false') {
        query.isAvailable = false;
      }
    }

    if (minCapacity !== undefined) {
      const parsedCapacity = Number(minCapacity);
      if (!isNaN(parsedCapacity) && parsedCapacity > 0) {
        query.capacity = { $gte: parsedCapacity };
      }
    }

    const venues = await Venue.find(query).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: venues.length,
      venues: venues.map((v) => v.toJSON())
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/venues/:id
 * Access: Authenticated (student, president, college_admin)
 * Retrieves a single venue by ID.
 */
export const getVenueById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid venue ID format.'
      });
      return;
    }

    const venue = await Venue.findById(id);
    if (!venue) {
      res.status(404).json({
        success: false,
        message: 'Venue not found.'
      });
      return;
    }

    res.status(200).json({
      success: true,
      venue: venue.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/venues/:id/schedule
 * Access: Authenticated (student, president, college_admin)
 * Retrieves booked and approved events for a venue on a specified date.
 */
export const getVenueSchedule = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid venue ID format.'
      });
      return;
    }

    const venue = await Venue.findById(id);
    if (!venue) {
      res.status(404).json({
        success: false,
        message: 'Venue not found.'
      });
      return;
    }

    if (!date || typeof date !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Query parameter "date" (YYYY-MM-DD) is required.'
      });
      return;
    }

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Invalid date format.'
      });
      return;
    }

    const lowerBound = new Date(targetDate.getTime() - 24 * 60 * 60 * 1000);
    const upperBound = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);

    const events = await Event.find({
      venueId: venue._id,
      status: { $in: [EventStatus.APPROVED, EventStatus.PENDING_APPROVAL] },
      date: { $gte: lowerBound, $lte: upperBound }
    })
      .populate('clubId', 'name shortName')
      .populate('proposedBy', 'name email');

    const targetDateStr = formatToDateString(targetDate);
    const dayBookings = events.filter((e) => isSameCalendarDay(e.date, targetDateStr));

    res.status(200).json({
      success: true,
      venue: venue.toJSON(),
      date: targetDateStr,
      count: dayBookings.length,
      bookings: dayBookings.map((e) => ({
        id: e._id.toString(),
        title: e.title,
        eventType: e.eventType,
        category: e.category,
        startTime: e.startTime,
        endTime: e.endTime,
        status: e.status,
        club: e.clubId || null,
        proposedBy: e.proposedBy || null
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/venues/check-conflict
 * Access: Authenticated (student, president, college_admin)
 * Tests a proposed venue booking for time clashes, maintenance, or capacity limits.
 */
export const checkConflict = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      venueId,
      date,
      startTime,
      endTime,
      maxParticipants,
      excludeEventId,
      checkPending
    } = req.body;

    if (!venueId) {
      res.status(400).json({
        success: false,
        message: 'venueId is required.'
      });
      return;
    }

    if (!date) {
      res.status(400).json({
        success: false,
        message: 'date is required.'
      });
      return;
    }

    if (!startTime || !endTime) {
      res.status(400).json({
        success: false,
        message: 'startTime and endTime are required.'
      });
      return;
    }

    const result = await checkVenueConflict({
      venueId,
      date,
      startTime,
      endTime,
      maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
      excludeEventId,
      checkPending: Boolean(checkPending)
    });

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/venues
 * Access: College Admin only
 * Creates a new venue.
 */
export const createVenue = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user || user.role !== UserRole.COLLEGE_ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. Only College Admins can create venues.'
      });
      return;
    }

    const {
      name,
      building,
      floor,
      capacity,
      facilities,
      isAvailable,
      operationalStatus
    } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({
        success: false,
        message: 'Venue name is required.'
      });
      return;
    }

    if (!building || typeof building !== 'string' || !building.trim()) {
      res.status(400).json({
        success: false,
        message: 'Building name is required.'
      });
      return;
    }

    if (capacity === undefined || isNaN(Number(capacity)) || Number(capacity) < 1) {
      res.status(400).json({
        success: false,
        message: 'Valid capacity (minimum 1) is required.'
      });
      return;
    }

    const existing = await Venue.findOne({
      name: { $regex: `^${name.trim()}$`, $options: 'i' }
    });
    if (existing) {
      res.status(409).json({
        success: false,
        message: `A venue with the name '${name.trim()}' already exists.`
      });
      return;
    }

    const venue = new Venue({
      name: name.trim(),
      building: building.trim(),
      floor: floor ? floor.trim() : '',
      capacity: Number(capacity),
      facilities: Array.isArray(facilities) ? facilities : [],
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      operationalStatus:
        operationalStatus && Object.values(VenueOperationalStatus).includes(operationalStatus)
          ? operationalStatus
          : VenueOperationalStatus.OPERATIONAL
    });

    await venue.save();

    res.status(201).json({
      success: true,
      message: 'Venue created successfully.',
      venue: venue.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/venues/:id
 * Access: College Admin only
 * Updates venue details.
 */
export const updateVenue = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user || user.role !== UserRole.COLLEGE_ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. Only College Admins can update venues.'
      });
      return;
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid venue ID format.'
      });
      return;
    }

    const venue = await Venue.findById(id);
    if (!venue) {
      res.status(404).json({
        success: false,
        message: 'Venue not found.'
      });
      return;
    }

    const {
      name,
      building,
      floor,
      capacity,
      facilities,
      isAvailable,
      operationalStatus
    } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        res.status(400).json({
          success: false,
          message: 'Venue name cannot be empty.'
        });
        return;
      }

      // Check unique name on different doc
      const existing = await Venue.findOne({
        _id: { $ne: venue._id },
        name: { $regex: `^${name.trim()}$`, $options: 'i' }
      });
      if (existing) {
        res.status(409).json({
          success: false,
          message: `A venue with the name '${name.trim()}' already exists.`
        });
        return;
      }
      venue.name = name.trim();
    }

    if (building !== undefined) {
      venue.building = String(building).trim();
    }

    if (floor !== undefined) {
      venue.floor = String(floor).trim();
    }

    if (capacity !== undefined) {
      const parsedCapacity = Number(capacity);
      if (isNaN(parsedCapacity) || parsedCapacity < 1) {
        res.status(400).json({
          success: false,
          message: 'Capacity must be at least 1.'
        });
        return;
      }
      venue.capacity = parsedCapacity;
    }

    if (facilities !== undefined) {
      venue.facilities = Array.isArray(facilities) ? facilities : [];
    }

    if (isAvailable !== undefined) {
      venue.isAvailable = Boolean(isAvailable);
    }

    if (operationalStatus !== undefined) {
      if (!Object.values(VenueOperationalStatus).includes(operationalStatus)) {
        res.status(400).json({
          success: false,
          message: `Invalid operational status. Must be one of: ${Object.values(VenueOperationalStatus).join(', ')}`
        });
        return;
      }
      venue.operationalStatus = operationalStatus;
    }

    await venue.save();

    res.status(200).json({
      success: true,
      message: 'Venue updated successfully.',
      venue: venue.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/venues/:id/status
 * Access: College Admin only
 * Toggles availability or updates operational status.
 */
export const updateVenueStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user || user.role !== UserRole.COLLEGE_ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. Only College Admins can update venue status.'
      });
      return;
    }

    const { id } = req.params;
    const { isAvailable, operationalStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid venue ID format.'
      });
      return;
    }

    const venue = await Venue.findById(id);
    if (!venue) {
      res.status(404).json({
        success: false,
        message: 'Venue not found.'
      });
      return;
    }

    if (isAvailable !== undefined) {
      venue.isAvailable = Boolean(isAvailable);
    }

    if (operationalStatus !== undefined) {
      if (!Object.values(VenueOperationalStatus).includes(operationalStatus)) {
        res.status(400).json({
          success: false,
          message: `Invalid operational status. Must be one of: ${Object.values(VenueOperationalStatus).join(', ')}`
        });
        return;
      }
      venue.operationalStatus = operationalStatus;
    }

    await venue.save();

    res.status(200).json({
      success: true,
      message: 'Venue status updated successfully.',
      venue: venue.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/venues/:id
 * Access: College Admin only
 * Deletes a venue if no upcoming approved events are scheduled.
 */
export const deleteVenue = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user || user.role !== UserRole.COLLEGE_ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. Only College Admins can delete venues.'
      });
      return;
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid venue ID format.'
      });
      return;
    }

    const venue = await Venue.findById(id);
    if (!venue) {
      res.status(404).json({
        success: false,
        message: 'Venue not found.'
      });
      return;
    }

    // Check if venue has upcoming approved events
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeBookings = await Event.countDocuments({
      venueId: venue._id,
      status: EventStatus.APPROVED,
      date: { $gte: today }
    });

    if (activeBookings > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete venue. There are ${activeBookings} upcoming approved event(s) scheduled at this venue.`
      });
      return;
    }

    await Venue.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Venue deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
