import mongoose from 'mongoose';
import { Venue, VenueOperationalStatus, IVenue } from '../models/Venue.js';
import { Event, EventStatus, IEvent } from '../models/Event.js';
import { Club } from '../models/Club.js';

export interface CheckVenueConflictOptions {
  venueId: string | mongoose.Types.ObjectId;
  date: Date | string;
  startTime: string;
  endTime: string;
  maxParticipants?: number | null;
  excludeEventId?: string | mongoose.Types.ObjectId;
  checkPending?: boolean;
}

export type ConflictType =
  | 'NOT_FOUND'
  | 'VENUE_UNAVAILABLE'
  | 'VENUE_MAINTENANCE'
  | 'CAPACITY_EXCEEDED'
  | 'TIME_CLASH';

export interface VenueConflictResult {
  hasConflict: boolean;
  type?: ConflictType;
  message?: string;
  conflictingEvent?: {
    id: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    clubName?: string;
    status: string;
  };
  venue?: {
    id: string;
    name: string;
    capacity: number;
    operationalStatus: string;
    isAvailable: boolean;
  };
}

/**
 * Converts a time string (e.g. "10:00", "14:30", "10:00 AM", "02:30 PM")
 * into total minutes from midnight (0 to 1439).
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const trimmed = timeStr.trim();

  // Check 12-hour format with AM/PM (e.g., "10:00 AM", "01:30 PM", "9:15am")
  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const ampm = ampmMatch[3]?.toUpperCase();

    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    return hours * 60 + minutes;
  }

  // Fallback to simple split
  const parts = trimmed.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

/**
 * Checks if two time intervals on the same day overlap.
 * Intervals [startA, endA] and [startB, endB] overlap if max(startA, startB) < min(endA, endB)
 * or if start times match.
 */
export function isTimeOverlapping(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const sA = timeStringToMinutes(startA);
  const eA = timeStringToMinutes(endA);
  const sB = timeStringToMinutes(startB);
  const eB = timeStringToMinutes(endB);

  if (sA === sB) return true;
  return Math.max(sA, sB) < Math.min(eA, eB);
}

/**
 * Formats a Date or date string to YYYY-MM-DD
 */
export function formatToDateString(d: Date | string): string {
  if (typeof d === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(d.trim())) {
      return d.trim();
    }
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
    return d.split('T')[0];
  }
  return d.toISOString().split('T')[0];
}

/**
 * Checks if two dates represent the exact same calendar day
 */
export function isSameCalendarDay(d1: Date | string, d2: Date | string): boolean {
  return formatToDateString(d1) === formatToDateString(d2);
}

/**
 * Validates venue availability, operational status, capacity, and detects time conflicts
 * against existing booked events.
 */
export async function checkVenueConflict(
  options: CheckVenueConflictOptions
): Promise<VenueConflictResult> {
  const {
    venueId,
    date,
    startTime,
    endTime,
    maxParticipants,
    excludeEventId,
    checkPending = false
  } = options;

  if (!venueId || !mongoose.Types.ObjectId.isValid(venueId.toString())) {
    return {
      hasConflict: true,
      type: 'NOT_FOUND',
      message: 'Invalid venue ID format.'
    };
  }

  const venueDoc = await Venue.findById(venueId);
  if (!venueDoc) {
    return {
      hasConflict: true,
      type: 'NOT_FOUND',
      message: 'Referenced venue not found.'
    };
  }

  const venueSummary = {
    id: venueDoc._id.toString(),
    name: venueDoc.name,
    capacity: venueDoc.capacity,
    operationalStatus: venueDoc.operationalStatus,
    isAvailable: venueDoc.isAvailable
  };

  // 1. Check venue general availability toggle
  if (venueDoc.isAvailable === false) {
    return {
      hasConflict: true,
      type: 'VENUE_UNAVAILABLE',
      message: `Venue '${venueDoc.name}' is currently marked as unavailable for booking.`,
      venue: venueSummary
    };
  }

  // 2. Check venue operational status
  if (venueDoc.operationalStatus === VenueOperationalStatus.MAINTENANCE) {
    return {
      hasConflict: true,
      type: 'VENUE_MAINTENANCE',
      message: `Venue '${venueDoc.name}' is currently under maintenance and cannot be booked.`,
      venue: venueSummary
    };
  }

  if (venueDoc.operationalStatus === VenueOperationalStatus.UNAVAILABLE) {
    return {
      hasConflict: true,
      type: 'VENUE_UNAVAILABLE',
      message: `Venue '${venueDoc.name}' is currently marked as unavailable.`,
      venue: venueSummary
    };
  }

  // 3. Check capacity limit
  if (maxParticipants && maxParticipants > venueDoc.capacity) {
    return {
      hasConflict: true,
      type: 'CAPACITY_EXCEEDED',
      message: `Requested participant limit (${maxParticipants}) exceeds maximum venue capacity (${venueDoc.capacity}) for '${venueDoc.name}'.`,
      venue: venueSummary
    };
  }

  // 4. Query events scheduled for this venue
  const targetDateStr = formatToDateString(date);
  const targetDateObj = new Date(date);
  const lowerBound = new Date(targetDateObj.getTime() - 24 * 60 * 60 * 1000);
  const upperBound = new Date(targetDateObj.getTime() + 24 * 60 * 60 * 1000);

  const statusesToCheck: EventStatus[] = [EventStatus.APPROVED];
  if (checkPending) {
    statusesToCheck.push(EventStatus.PENDING_APPROVAL);
  }

  const query: any = {
    venueId: venueDoc._id,
    status: { $in: statusesToCheck },
    date: { $gte: lowerBound, $lte: upperBound }
  };

  if (excludeEventId && mongoose.Types.ObjectId.isValid(excludeEventId.toString())) {
    query._id = { $ne: new mongoose.Types.ObjectId(excludeEventId.toString()) };
  }

  const potentialClashes = await Event.find(query);

  // Filter in-memory for exact calendar day and time overlap
  for (const event of potentialClashes) {
    if (!isSameCalendarDay(event.date, targetDateStr)) {
      continue;
    }

    if (isTimeOverlapping(startTime, endTime, event.startTime, event.endTime)) {
      let clubName = 'College / Department';
      if (event.clubId) {
        const clubDoc = await Club.findById(event.clubId);
        if (clubDoc) {
          clubName = clubDoc.name;
        }
      }

      const formattedClub = clubName.toLowerCase().endsWith('club')
        ? clubName
        : `${clubName} club`;

      return {
        hasConflict: true,
        type: 'TIME_CLASH',
        message: `It is Booked for same date and time by ${formattedClub} (${event.title} from ${event.startTime} to ${event.endTime}).`,
        conflictingEvent: {
          id: event._id.toString(),
          title: event.title,
          date: formatToDateString(event.date),
          startTime: event.startTime,
          endTime: event.endTime,
          clubName,
          status: event.status
        },
        venue: venueSummary
      };
    }
  }

  return {
    hasConflict: false,
    venue: venueSummary
  };
}
