import { CampusEvent, ConflictCheckResult, Registration } from '../types';

/**
 * Format standard date into display strings (e.g., '15 Sep 2026', 'Tuesday, 15 September')
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function formatFullDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Convert 24-hr time '14:30' to '02:30 PM'
 */
export function formatDisplayTime(timeStr: string): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hour = parseInt(parts[0], 10);
  const min = parts[1];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12;
  const strHour = hour < 10 ? `0${hour}` : `${hour}`;
  return `${strHour}:${min} ${ampm}`;
}

/**
 * Check if two time intervals overlap on the same date
 */
export function isTimeOverlapping(
  date1: string,
  start1: string,
  end1: string,
  date2: string,
  start2: string,
  end2: string
): boolean {
  if (date1 !== date2) return false;
  // Convert 'HH:MM' to total minutes from midnight
  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);

  // Overlaps if start of one is before end of other and vice versa
  return Math.max(s1, s2) < Math.min(e1, e2);
}

/**
 * Detect both venue conflicts and time conflicts against existing approved/published events
 */
export function detectEventConflicts(
  target: {
    id?: string;
    date: string;
    startTime: string;
    endTime: string;
    venueId: string;
  },
  existingEvents: CampusEvent[]
): ConflictCheckResult {
  const activeEvents = existingEvents.filter(
    (e) =>
      e.id !== target.id &&
      (e.status === 'approved' || e.status === 'published' || e.status === 'registration_open') &&
      e.date === target.date
  );

  // 1. Check for venue clash (same venue + overlapping time)
  const venueClash = activeEvents.find(
    (e) =>
      e.venueId === target.venueId &&
      isTimeOverlapping(target.date, target.startTime, target.endTime, e.date, e.startTime, e.endTime)
  );

  if (venueClash) {
    return {
      hasConflict: true,
      type: 'venue',
      conflictingEvent: venueClash,
      message: `Venue Conflict: "${venueClash.venueName}" is already reserved for "${venueClash.title}" from ${formatDisplayTime(venueClash.startTime)} to ${formatDisplayTime(venueClash.endTime)}.`
    };
  }

  // 2. Check for general schedule overlap (same time, different venue)
  const scheduleOverlap = activeEvents.find((e) =>
    isTimeOverlapping(target.date, target.startTime, target.endTime, e.date, e.startTime, e.endTime)
  );

  if (scheduleOverlap) {
    return {
      hasConflict: true,
      type: 'time',
      conflictingEvent: scheduleOverlap,
      message: `Schedule Warning: Event overlaps with "${scheduleOverlap.title}" (${formatDisplayTime(scheduleOverlap.startTime)} – ${formatDisplayTime(scheduleOverlap.endTime)} at ${scheduleOverlap.venueName}).`
    };
  }

  return { hasConflict: false };
}

/**
 * Generate standard .ICS file for Apple/Outlook/Google Calendar import
 */
export function generateIcsFile(event: CampusEvent): void {
  const cleanStr = (s?: string) => (s ? s.replace(/\n/g, '\\n').replace(/,/g, '\\,') : '');

  // Format YYYYMMDDTHHMMSS
  const formatIcsDate = (dateStr: string, timeStr: string) => {
    const [y, m, d] = dateStr.split('-');
    const [hh, mm] = timeStr.split(':');
    return `${y}${m}${d}T${hh || '09'}${mm || '00'}00`;
  };

  const dtStart = formatIcsDate(event.date, event.startTime);
  const dtEnd = formatIcsDate(event.date, event.endTime);
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CampusConnect//College Event Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:cc-evt-${event.id}@campusconnect.pict.edu`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${cleanStr(event.title)}`,
    `DESCRIPTION:${cleanStr(event.shortDescription + '\n\n' + event.fullDescription)}`,
    `LOCATION:${cleanStr(event.venueName)}`,
    `ORGANIZER;CN=${cleanStr(event.organizerName)}:mailto:${event.contactEmail || 'campus@pict.edu'}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate direct Google Calendar link
 */
export function getGoogleCalendarUrl(event: CampusEvent): string {
  const formatUtc = (dateStr: string, timeStr: string) => {
    const [y, m, d] = dateStr.split('-');
    const [hh, mm] = timeStr.split(':');
    return `${y}${m}${d}T${hh || '09'}${mm || '00'}00`;
  };

  const dates = `${formatUtc(event.date, event.startTime)}/${formatUtc(event.date, event.endTime)}`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: dates,
    details: `${event.shortDescription}\n\nOrganized by: ${event.organizerName}\nContact: ${event.contactEmail}`,
    location: event.venueName
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate direct Outlook Calendar Web link
 */
export function getOutlookCalendarUrl(event: CampusEvent): string {
  const startIso = `${event.date}T${event.startTime}:00`;
  const endIso = `${event.date}T${event.endTime}:00`;

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: startIso,
    enddt: endIso,
    body: `${event.shortDescription}\n\nOrganizer: ${event.organizerName}`,
    location: event.venueName
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Calculate countdown time remaining
 */
export function calculateTimeRemaining(targetDateStr: string, targetTimeStr: string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
  totalHours: number;
} {
  const target = new Date(`${targetDateStr}T${targetTimeStr}:00`).getTime();
  const now = new Date().getTime();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true, totalHours: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  const totalHours = Math.floor(diff / (1000 * 60 * 60));

  return { days, hours, minutes, seconds, isPast: false, totalHours };
}

/**
 * Format a Date object into 'September 2026'
 */
export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Generate a 7x5 or 7x6 calendar matrix of dates for a given month and year
 */
export function getMonthMatrix(year: number, month: number): Array<
  Array<{
    date: Date;
    dateStr: string;
    isCurrentMonth: boolean;
    dayNumber: number;
    isToday: boolean;
  }>
> {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Sunday = 0
  const startDayOfWeek = firstDayOfMonth.getDay();
  const totalDaysInMonth = lastDayOfMonth.getDate();

  const matrix: Array<
    Array<{
      date: Date;
      dateStr: string;
      isCurrentMonth: boolean;
      dayNumber: number;
      isToday: boolean;
    }>
  > = [];

  const todayStr = new Date().toISOString().slice(0, 10);

  let currentWeek: Array<{
    date: Date;
    dateStr: string;
    isCurrentMonth: boolean;
    dayNumber: number;
    isToday: boolean;
  }> = [];

  // Previous month trailing days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLastDay - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    currentWeek.push({
      date: d,
      dateStr,
      isCurrentMonth: false,
      dayNumber: prevMonthLastDay - i,
      isToday: dateStr === todayStr
    });
  }

  // Current month days
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const d = new Date(year, month, day);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    currentWeek.push({
      date: d,
      dateStr,
      isCurrentMonth: true,
      dayNumber: day,
      isToday: dateStr === todayStr
    });

    if (currentWeek.length === 7) {
      matrix.push(currentWeek);
      currentWeek = [];
    }
  }

  // Next month leading days to complete the last week
  if (currentWeek.length > 0) {
    let nextMonthDay = 1;
    while (currentWeek.length < 7) {
      const d = new Date(year, month + 1, nextMonthDay);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      currentWeek.push({
        date: d,
        dateStr,
        isCurrentMonth: false,
        dayNumber: nextMonthDay,
        isToday: dateStr === todayStr
      });
      nextMonthDay++;
    }
    matrix.push(currentWeek);
  }

  return matrix;
}

/**
 * Export generic CSV
 */
export function exportToCsv(filename: string, rows: Record<string, any>[]): void {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const val = row[header] ?? '';
          const escaped = String(val).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(',')
    )
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
