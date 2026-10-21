/**
 * CampusConnect Event Time & End-Date Evaluation Utilities
 *
 * Core rule: An event is considered past when its actual end date and end time have passed.
 * - Multi-day events: Visible until their final end date (endDate) and end time have passed.
 * - In-progress events: If start time has passed but end time is still in the future, event remains active (NOT past).
 * - Fallback rule: If endTime is missing, empty, or invalid format, the end time defaults safely
 *   to 23:59:59.999 on that day so upcoming or today's events are not prematurely hidden.
 * - Invalid date fallback: If date is missing or completely invalid, returns false (event is not hidden).
 */

export interface EventTimeInput {
  date: Date | string;
  endDate?: Date | string | null;
  startTime?: string | null;
  endTime?: string | null;
}

/**
 * Normalizes a Date object or date string into YYYY-MM-DD format.
 */
export function formatToDateString(d: Date | string): string {
  if (!d) return '';
  if (typeof d === 'string') {
    const trimmed = d.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
    return trimmed.split('T')[0] || '';
  }
  if (d instanceof Date) {
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  }
  return '';
}

/**
 * Parses time string in either 24-hr format ('14:30', '09:00') or 12-hr format ('02:30 PM', '10:00 AM')
 * into 24-hour hours (0-23) and minutes (0-59).
 * Returns null if string is missing or invalid.
 */
export function parseTimeToHoursAndMinutes(
  timeStr?: string | null
): { hours: number; minutes: number } | null {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const trimmed = timeStr.trim();
  if (!trimmed) return null;

  // Regex matching HH:MM with optional AM/PM meridian
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3]?.toUpperCase();

    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return { hours, minutes };
    }
  }

  // Fallback to simple split if HH:MM
  const parts = trimmed.split(':');
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(h) && !isNaN(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return { hours: h, minutes: m };
    }
  }

  return null;
}

/**
 * Computes the exact Date when an event concludes.
 * Multi-day events evaluate against endDate; single-day events evaluate against date.
 * If endTime is missing or invalid, applies the safe fallback: 23:59:59.999 on the target day.
 */
export function getEventEndDateTime(event: EventTimeInput): Date | null {
  if (!event) return null;

  // Multi-day events take precedence with endDate; single day uses date
  const effectiveDate = event.endDate ? event.endDate : event.date;
  const dateStr = formatToDateString(effectiveDate);

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return null;
  }

  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return null;

  const parsedTime = parseTimeToHoursAndMinutes(event.endTime);

  if (parsedTime !== null) {
    // Exact end date and time
    return new Date(year, month - 1, day, parsedTime.hours, parsedTime.minutes, 0, 0);
  }

  // Safe Fallback Rule: If endTime is missing or invalid, event remains valid until end of day (23:59:59.999)
  return new Date(year, month - 1, day, 23, 59, 59, 999);
}

/**
 * Returns true if the event has ended relative to referenceTime (default: new Date()).
 * Returns false if the event is upcoming, currently in progress, or has invalid date.
 */
export function isEventPast(
  event: EventTimeInput,
  referenceTime: Date = new Date()
): boolean {
  const endDateTime = getEventEndDateTime(event);
  if (!endDateTime) {
    // If date is missing/invalid, do not hide (fallback safe rule)
    return false;
  }
  return referenceTime.getTime() > endDateTime.getTime();
}

/**
 * Returns true if the event is currently active (upcoming or in-progress).
 */
export function isEventActive(
  event: EventTimeInput,
  referenceTime: Date = new Date()
): boolean {
  return !isEventPast(event, referenceTime);
}
