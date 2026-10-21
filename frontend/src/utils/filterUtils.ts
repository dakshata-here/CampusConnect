import { CampusEvent } from '../types';
import { formatDateToYYYYMMDD, getWeekDays, isEventPast } from './calendarUtils';

export interface EventFilterCriteria {
  searchQuery: string;
  category: string;
  status: string;
  clubId: string;
  venueId: string;
  dateRange: string; // 'all' | 'today' | 'this_week' | 'this_month' | 'custom' | YYYY-MM-DD
  startDate?: string;
  endDate?: string;
}

export const DEFAULT_FILTER_CRITERIA: EventFilterCriteria = {
  searchQuery: '',
  category: 'all',
  status: 'all',
  clubId: 'all',
  venueId: 'all',
  dateRange: 'all',
  startDate: '',
  endDate: ''
};

export interface FilterOptions {
  userRole?: 'student' | 'president' | 'subhead' | 'college_admin';
  clubId?: string | null;
  clubName?: string | null;
  enforceApprovedOnly?: boolean;
  includePast?: boolean;
}

/**
 * Normalizes club comparison between ObjectIds, legacy IDs, and club names
 */
export function matchesClubIdentity(
  event: CampusEvent,
  targetClubIdOrName: string
): boolean {
  if (!targetClubIdOrName || targetClubIdOrName === 'all') return true;

  const targetLower = targetClubIdOrName.toLowerCase().trim();

  // Check ID / ObjectId matches
  if (event.clubId && event.clubId.toLowerCase() === targetLower) return true;
  if (event.club?.id && event.club.id.toLowerCase() === targetLower) return true;
  if (event.club?._id && event.club._id.toLowerCase() === targetLower) return true;

  // Check Name / ShortName matches
  if (event.clubName && event.clubName.toLowerCase().trim() === targetLower) return true;
  if (event.club?.name && event.club.name.toLowerCase().trim() === targetLower) return true;
  if (event.club?.shortName && event.club.shortName.toLowerCase().trim() === targetLower) return true;

  return false;
}

/**
 * Normalizes venue comparison between ObjectIds, legacy IDs, and venue names
 */
export function matchesVenueIdentity(
  event: CampusEvent,
  targetVenueIdOrName: string
): boolean {
  if (!targetVenueIdOrName || targetVenueIdOrName === 'all') return true;

  const targetLower = targetVenueIdOrName.toLowerCase().trim();

  // Check ID / ObjectId matches
  if (event.venueId && event.venueId.toLowerCase() === targetLower) return true;
  if (event.venue?.id && event.venue.id.toLowerCase() === targetLower) return true;
  if (event.venue?._id && event.venue._id.toLowerCase() === targetLower) return true;

  // Check Name matches
  if (event.venueName && event.venueName.toLowerCase().trim() === targetLower) return true;
  if (event.venue?.name && event.venue.name.toLowerCase().trim() === targetLower) return true;

  return false;
}

/**
 * Core filtering function using strict AND logic across all specified filter conditions
 */
export function filterEvents(
  events: CampusEvent[],
  criteria: Partial<EventFilterCriteria>,
  options: FilterOptions = {}
): CampusEvent[] {
  const active: EventFilterCriteria = {
    ...DEFAULT_FILTER_CRITERIA,
    ...criteria
  };

  const todayStr = formatDateToYYYYMMDD(new Date());

  return events.filter((e) => {
    const statusLower = (e.status || '').toLowerCase();
    const categoryLower = (e.category || '').toLowerCase();
    const eventTypeLower = (e.eventType || '').toLowerCase();

    // 0. Automatic past-event exclusion across all active views
    const isCompletedFilter = active.status.toLowerCase() === 'completed';
    if (!options.includePast && !isCompletedFilter) {
      if (isEventPast(e)) {
        return false;
      }
    }

    // 1. Role-based event visibility restriction
    if (options.enforceApprovedOnly || options.userRole === 'student') {
      const isPubliclyVisible =
        ['published', 'approved', 'registration_open', 'registration_closed', 'completed', 'live', 'postponed', 'rescheduled'].includes(
          statusLower
        ) && statusLower !== 'cancelled';

      if (!isPubliclyVisible) return false;
    }

    // 2. Club ownership restriction (for President/Club Lead context when filtering own club)
    if (options.clubId) {
      const isClubEvent =
        matchesClubIdentity(e, options.clubId) ||
        (options.clubName ? matchesClubIdentity(e, options.clubName) : false);

      if (!isClubEvent) return false;
    }

    // 3. Search query filter (title, description, clubName, venueName, eventType, tags)
    if (active.searchQuery && active.searchQuery.trim()) {
      const q = active.searchQuery.toLowerCase().trim();
      const inTitle = (e.title || '').toLowerCase().includes(q);
      const inShortDesc = (e.shortDescription || '').toLowerCase().includes(q);
      const inFullDesc = (e.fullDescription || e.description || '').toLowerCase().includes(q);
      const inClub = (e.clubName || '').toLowerCase().includes(q);
      const inVenue = (e.venueName || '').toLowerCase().includes(q);
      const inType = eventTypeLower.includes(q);
      const inOrganizer = (e.organizerName || '').toLowerCase().includes(q);
      const inTags = Array.isArray(e.tags) && e.tags.some((t) => (t || '').toLowerCase().includes(q));

      if (!(inTitle || inShortDesc || inFullDesc || inClub || inVenue || inType || inOrganizer || inTags)) {
        return false;
      }
    }

    // 4. Category filter
    if (active.category && active.category !== 'all') {
      const catLower = active.category.toLowerCase().trim();

      if (catLower === 'academic') {
        const isAcademic =
          categoryLower === 'academic' ||
          ['academic', 'internal exam', 'end sem exam', 'examination', 'practical examination', 'holiday', 'exam', 'project submission'].includes(
            eventTypeLower
          );
        if (!isAcademic) return false;
      } else if (catLower === 'hackathons') {
        const isHackathon = ['hackathon', 'ideathon', 'competition'].includes(eventTypeLower);
        if (!isHackathon) return false;
      } else if (catLower === 'workshops') {
        const isWorkshop = ['workshop', 'sig session', 'technical event', 'seminar', 'webinar', 'guest lecture'].includes(
          eventTypeLower
        );
        if (!isWorkshop) return false;
      } else if (catLower === 'club' || catLower === 'clubs') {
        const isClub =
          categoryLower === 'club' &&
          !['academic', 'internal exam', 'end sem exam', 'examination', 'practical examination', 'holiday'].includes(
            eventTypeLower
          );
        if (!isClub) return false;
      } else {
        const isMatch = categoryLower === catLower || eventTypeLower === catLower;
        if (!isMatch) return false;
      }
    }

    // 5. Status filter
    if (active.status && active.status !== 'all') {
      const targetStatus = active.status.toLowerCase().trim();

      if (targetStatus === 'approved' || targetStatus === 'published') {
        if (!['approved', 'published', 'registration_open'].includes(statusLower)) {
          return false;
        }
      } else if (targetStatus === 'pending' || targetStatus === 'pending_approval') {
        if (statusLower !== 'pending_approval') return false;
      } else if (targetStatus === 'changes' || targetStatus === 'changes_requested') {
        if (statusLower !== 'changes_requested') return false;
      } else if (targetStatus === 'rejected') {
        if (statusLower !== 'rejected') return false;
      } else if (targetStatus === 'completed') {
        if (statusLower !== 'completed') return false;
      } else if (targetStatus === 'cancelled') {
        if (statusLower !== 'cancelled') return false;
      } else {
        if (statusLower !== targetStatus) return false;
      }
    }

    // 6. Club filter
    if (active.clubId && active.clubId !== 'all') {
      if (!matchesClubIdentity(e, active.clubId)) return false;
    }

    // 7. Venue filter
    if (active.venueId && active.venueId !== 'all') {
      if (!matchesVenueIdentity(e, active.venueId)) return false;
    }

    // 8. Date / Date Range filter
    if (active.dateRange && active.dateRange !== 'all') {
      const eventDate = e.date ? String(e.date).slice(0, 10) : '';
      const eventEndDate = e.endDate ? String(e.endDate).slice(0, 10) : eventDate;
      if (!eventDate) return false;

      if (active.dateRange === 'today') {
        const matchesToday = eventDate === todayStr || (eventDate <= todayStr && eventEndDate >= todayStr);
        if (!matchesToday) return false;
      } else if (active.dateRange === 'this_week') {
        const week = getWeekDays(new Date());
        const startWeek = week[0].dateStr;
        const endWeek = week[6].dateStr;
        const matchesWeek =
          (eventDate >= startWeek && eventDate <= endWeek) ||
          (eventEndDate >= startWeek && eventEndDate <= endWeek) ||
          (eventDate <= startWeek && eventEndDate >= endWeek);
        if (!matchesWeek) return false;
      } else if (active.dateRange === 'this_month') {
        const ym = todayStr.slice(0, 7);
        const matchesMonth = eventDate.startsWith(ym) || eventEndDate.startsWith(ym);
        if (!matchesMonth) return false;
      } else if (active.dateRange === 'custom') {
        if (active.startDate && eventEndDate < active.startDate) return false;
        if (active.endDate && eventDate > active.endDate) return false;
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(active.dateRange)) {
        const targetDate = active.dateRange;
        const matchesTarget = eventDate === targetDate || (eventDate <= targetDate && eventEndDate >= targetDate);
        if (!matchesTarget) return false;
      }
    }

    return true;
  });
}
