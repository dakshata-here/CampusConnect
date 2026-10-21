import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CampusEvent } from '../../types';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  Info,
  Search,
  Building2,
  RotateCcw,
  Download,
  CalendarDays,
  CalendarRange,
  ArrowRight
} from 'lucide-react';
import {
  getMonthMatrix,
  formatDisplayTime,
  formatDisplayDate,
  formatMonthYear,
  formatDateToYYYYMMDD,
  getWeekDays,
  formatWeekRange,
  formatDayHeader,
  generateIcsFile,
  isEventPast
} from '../../utils/calendarUtils';
import { StatusBadge } from '../common/StatusBadge';
import { matchesClubIdentity, matchesVenueIdentity } from '../../utils/filterUtils';

export const CentralCalendar: React.FC = () => {
  const {
    events,
    clubs,
    venues,
    academicNotices,
    currentUser,
    setSelectedEventForModal
  } = useApp();

  // Active viewing date: default to today or anchor date
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDayDate, setSelectedDayDate] = useState<string>(() => formatDateToYYYYMMDD(new Date()));
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  // Filters state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedClubFilter, setSelectedClubFilter] = useState<string>('all');
  const [selectedVenueFilter, setSelectedVenueFilter] = useState<string>('all');

  // Convert academic notices into calendar display format
  const academicCalendarEvents: CampusEvent[] = (academicNotices || [])
    .filter((n) => n.status === 'Published' || n.addedToCalendar)
    .map((n) => ({
      id: n.id,
      title: n.title,
      eventType: (['Examination', 'Practical Examination', 'End Sem Exam', 'Internal Exam'].includes(n.eventType)
        ? 'Internal Exam'
        : n.eventType === 'Holiday'
        ? 'Holiday'
        : 'Academic') as any,
      category: 'academic',
      academicType: ['Examination', 'Practical Examination'].includes(n.eventType)
        ? 'exam'
        : n.eventType === 'Holiday'
        ? 'holiday'
        : 'deadline',
      shortDescription: n.description,
      fullDescription: `${n.description}\n\nNotice Type: ${n.eventType}\nTarget Audience: ${n.department} - ${n.year} (${n.semester})\nPriority: ${n.priority}`,
      posterUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
      organizerName: n.createdByName || 'College Administration',
      date: n.date,
      startTime: n.startTime,
      endTime: n.endTime,
      venueId: 'acad_venue',
      venueName: n.venue,
      registrationRequired: false,
      registrationType: 'internal',
      maxParticipants: 1000,
      currentRegistrations: 0,
      eligibility: `${n.department} - ${n.year}`,
      contactPerson: n.createdByName || 'Administration',
      contactEmail: 'admin@college.edu',
      contactNumber: '+91 20 2437 1101',
      status: 'published',
      createdBy: n.createdBy,
      createdByName: n.createdByName,
      createdByRole: 'college_admin',
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
      tags: ['Academic', n.eventType, n.priority]
    }));

  const allEventsForCalendar = [...events, ...academicCalendarEvents];

  // Role-based visibility and filters combination using strict AND logic
  const visibleEvents = allEventsForCalendar.filter((e) => {
    const statusLower = (e.status || '').toLowerCase();
    const categoryLower = (e.category || '').toLowerCase();
    const eventTypeLower = (e.eventType || '').toLowerCase();

    // 0. Automatic past-event exclusion from active calendar views
    if (isEventPast(e)) {
      return false;
    }

    // 1. Role permission: students must only see approved / published public events
    const isAdmin = currentUser.role === 'college_admin';
    if (!isAdmin) {
      if (statusLower === 'cancelled') return false;
      const isApproved = [
        'approved',
        'published',
        'registration_open',
        'registration_closed',
        'completed',
        'live',
        'postponed',
        'rescheduled'
      ].includes(statusLower);
      if (!isApproved) return false;
    }

    // 2. Search query filter (title, description, venue, club, eventType)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const inTitle = (e.title || '').toLowerCase().includes(q);
      const inDesc = (e.shortDescription || e.description || '').toLowerCase().includes(q);
      const inClub = (e.clubName || '').toLowerCase().includes(q);
      const inVenue = (e.venueName || '').toLowerCase().includes(q);
      const inType = eventTypeLower.includes(q);

      if (!(inTitle || inDesc || inClub || inVenue || inType)) return false;
    }

    // 3. Category / Layer filter
    if (selectedCategoryFilter !== 'all') {
      const catTarget = selectedCategoryFilter.toLowerCase();
      if (catTarget === 'academic') {
        const isAcad =
          categoryLower === 'academic' ||
          ['academic', 'internal exam', 'end sem exam', 'examination', 'practical examination', 'holiday'].includes(
            eventTypeLower
          );
        if (!isAcad) return false;
      } else if (catTarget === 'club') {
        const isClub =
          categoryLower === 'club' &&
          !['academic', 'internal exam', 'end sem exam', 'examination', 'practical examination', 'holiday'].includes(
            eventTypeLower
          );
        if (!isClub) return false;
      } else if (catTarget === 'hackathons') {
        if (!['hackathon', 'ideathon', 'competition'].includes(eventTypeLower)) return false;
      } else if (catTarget === 'workshops') {
        if (!['workshop', 'sig session', 'technical event', 'seminar', 'webinar'].includes(eventTypeLower)) return false;
      }
    }

    // 4. Club filter
    if (selectedClubFilter !== 'all') {
      if (!matchesClubIdentity(e, selectedClubFilter)) return false;
    }

    // 5. Venue filter
    if (selectedVenueFilter !== 'all') {
      if (!matchesVenueIdentity(e, selectedVenueFilter)) return false;
    }

    return true;
  });

  // Date Navigation Handlers (Unified across Daily, Weekly, and Monthly views)
  const prevDate = () => {
    if (viewMode === 'day') {
      const prev = new Date(currentDate);
      prev.setDate(prev.getDate() - 1);
      setCurrentDate(prev);
      setSelectedDayDate(formatDateToYYYYMMDD(prev));
    } else if (viewMode === 'week') {
      const prev = new Date(currentDate);
      prev.setDate(prev.getDate() - 7);
      setCurrentDate(prev);
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    }
  };

  const nextDate = () => {
    if (viewMode === 'day') {
      const next = new Date(currentDate);
      next.setDate(next.getDate() + 1);
      setCurrentDate(next);
      setSelectedDayDate(formatDateToYYYYMMDD(next));
    } else if (viewMode === 'week') {
      const next = new Date(currentDate);
      next.setDate(next.getDate() + 7);
      setCurrentDate(next);
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDayDate(formatDateToYYYYMMDD(today));
  };

  // Helper to extract events on a specific date string (YYYY-MM-DD)
  const getEventsForDay = (dateStr: string) => {
    return visibleEvents
      .filter((e) => {
        const start = e.date ? String(e.date).slice(0, 10) : '';
        const end = e.endDate ? String(e.endDate).slice(0, 10) : start;
        return start === dateStr || (start <= dateStr && end >= dateStr);
      })
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  };

  const monthMatrix = getMonthMatrix(currentDate.getFullYear(), currentDate.getMonth());
  const weekDays = getWeekDays(currentDate);
  const activeDayDateStr = viewMode === 'day' ? formatDateToYYYYMMDD(currentDate) : selectedDayDate;
  const selectedDayEvents = getEventsForDay(activeDayDateStr);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedCategoryFilter !== 'all' ||
    selectedClubFilter !== 'all' ||
    selectedVenueFilter !== 'all';

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategoryFilter('all');
    setSelectedClubFilter('all');
    setSelectedVenueFilter('all');
  };

  // Event badge color helper
  const getEventTypeColor = (e: CampusEvent) => {
    const cat = (e.category || '').toLowerCase();
    const type = (e.eventType || '').toLowerCase();

    if (cat === 'academic' || ['internal exam', 'end sem exam', 'examination'].includes(type)) {
      return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30';
    }
    if (['hackathon', 'ideathon', 'competition'].includes(type)) {
      return 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30';
    }
    if (['workshop', 'sig session', 'technical event'].includes(type)) {
      return 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30';
    }
    return 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30';
  };

  return (
    <div className="space-y-6">
      
      {/* Top Controls Header */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        
        {/* Row 1: Date Navigation, View Mode Selector, and Today Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Navigation and Current Date Display */}
          <div className="flex items-center justify-between sm:justify-start gap-3 w-full md:w-auto">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 min-w-0 sm:min-w-[200px]">
              {viewMode === 'day'
                ? formatDayHeader(currentDate)
                : viewMode === 'week'
                ? formatWeekRange(currentDate)
                : formatMonthYear(currentDate)}
            </h2>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
              <button
                onClick={prevDate}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title={
                  viewMode === 'day'
                    ? 'Previous Day'
                    : viewMode === 'week'
                    ? 'Previous Week'
                    : 'Previous Month'
                }
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goToToday}
                className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={nextDate}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title={
                  viewMode === 'day'
                    ? 'Next Day'
                    : viewMode === 'week'
                    ? 'Next Week'
                    : 'Next Month'
                }
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* View Mode Selector Tabs: Daily, Weekly, Monthly */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold w-full sm:w-auto self-start sm:self-center">
            <button
              id="calendar-view-day-btn"
              onClick={() => {
                setViewMode('day');
                setSelectedDayDate(formatDateToYYYYMMDD(currentDate));
              }}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'day'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Daily</span>
            </button>

            <button
              id="calendar-view-week-btn"
              onClick={() => setViewMode('week')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'week'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Weekly</span>
            </button>

            <button
              id="calendar-view-month-btn"
              onClick={() => setViewMode('month')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'month'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Monthly</span>
            </button>
          </div>

        </div>

        {/* Row 2: Search, Category Tabs, Club Dropdown, and Venue Dropdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          
          {/* Keyword Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="calendar-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search calendar events..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Category Selector */}
          <div>
            <select
              id="calendar-category-select"
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="club">Clubs Only</option>
              <option value="academic">Academic & Exams</option>
              <option value="hackathons">Hackathons & Contests</option>
              <option value="workshops">Workshops & SIGs</option>
            </select>
          </div>

          {/* Club Dropdown */}
          <div>
            <select
              id="calendar-club-select"
              value={selectedClubFilter}
              onChange={(e) => setSelectedClubFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Clubs ({clubs.length})</option>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.shortName ? `${c.shortName} – ${c.name}` : c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Venue Dropdown */}
          <div>
            <select
              id="calendar-venue-select"
              value={selectedVenueFilter}
              onChange={(e) => setSelectedVenueFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Venues ({venues.length})</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.building})
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Legend & Clear Filter Reset Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3.5 flex-wrap">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Key:</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              General
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              Hackathons
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              Workshops
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Exams
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-600 dark:text-slate-300">
              {visibleEvents.length} event{visibleEvents.length !== 1 ? 's' : ''} shown
            </span>

            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="px-2 py-0.5 rounded text-blue-600 dark:text-blue-400 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 1. DAILY VIEW                                                            */}
      {/* ========================================================================= */}
      {viewMode === 'day' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Daily Timeline
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                {formatDayHeader(currentDate)}
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200 dark:border-blue-900">
              {selectedDayEvents.length} Event{selectedDayEvents.length !== 1 ? 's' : ''} Today
            </span>
          </div>

          {selectedDayEvents.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
              <CalendarIcon className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                No events scheduled on {formatDayHeader(currentDate)}
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                There are no approved events matching your active filters on this date.
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={prevDate}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                >
                  &larr; Previous Day
                </button>
                <button
                  onClick={nextDate}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                >
                  Next Day &rarr;
                </button>
                <button
                  onClick={() => setViewMode('month')}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                >
                  Monthly Grid
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDayEvents.map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEventForModal(evt)}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 rounded-full border border-blue-100 dark:border-blue-900">
                        {evt.clubName || evt.organizerName || 'Campus Event'}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {evt.eventType}
                      </span>
                      <StatusBadge status={evt.status} size="sm" />
                    </div>

                    <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {evt.title}
                    </h4>

                    {evt.shortDescription && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {evt.shortDescription}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap pt-1">
                      <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        <span>
                          {formatDisplayTime(evt.startTime)} – {formatDisplayTime(evt.endTime)}
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span>{evt.venueName}</span>
                      </span>
                      {evt.maxParticipants && (
                        <span>
                          Capacity: {evt.currentRegistrations || 0}/{evt.maxParticipants}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        generateIcsFile(evt);
                      }}
                      title="Download .ICS for Apple/Google Calendar"
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>.ICS</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedEventForModal(evt)}
                      className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>Details & Pass</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. WEEKLY VIEW                                                           */}
      {/* ========================================================================= */}
      {viewMode === 'week' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Weekly Grid
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                {formatWeekRange(currentDate)}
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Sunday through Saturday
            </span>
          </div>

          {/* 7-Day Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
            {weekDays.map((day) => {
              const dayEvts = getEventsForDay(day.dateStr);
              const isSelected = day.dateStr === selectedDayDate;

              return (
                <div
                  key={day.dateStr}
                  onClick={() => {
                    setSelectedDayDate(day.dateStr);
                    setCurrentDate(day.date);
                  }}
                  className={`p-3 rounded-2xl border transition-all flex flex-col justify-between min-h-[220px] ${
                    day.isToday
                      ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-400 dark:border-blue-700 ring-1 ring-blue-300 dark:ring-blue-800'
                      : isSelected
                      ? 'bg-slate-50 dark:bg-slate-800/80 border-blue-500 ring-1 ring-blue-500/50'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  {/* Day Header */}
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-[11px] font-bold uppercase text-slate-400 block">
                          {day.dayName}
                        </span>
                        <span
                          className={`text-lg font-black ${
                            day.isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {day.dayNumber}
                        </span>
                      </div>

                      {dayEvts.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-extrabold text-[10px]">
                          {dayEvts.length}
                        </span>
                      )}
                    </div>

                    {/* Events List for Day */}
                    <div className="mt-2.5 space-y-2">
                      {dayEvts.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic pt-4 text-center">
                          No events
                        </p>
                      ) : (
                        dayEvts.map((evt) => (
                          <div
                            key={evt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEventForModal(evt);
                            }}
                            className={`p-2 rounded-xl border text-[11px] space-y-1 transition-all hover:scale-[1.02] cursor-pointer shadow-2xs ${getEventTypeColor(
                              evt
                            )}`}
                            title={`${evt.title} (${evt.startTime} at ${evt.venueName})`}
                          >
                            <div className="flex items-center justify-between font-bold text-[10px]">
                              <span>{formatDisplayTime(evt.startTime)}</span>
                              <span className="truncate max-w-[80px] opacity-80">
                                {evt.clubName || evt.organizerName}
                              </span>
                            </div>
                            <h5 className="font-bold truncate text-slate-900 dark:text-slate-100">
                              {evt.title}
                            </h5>
                            <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
                              📍 {evt.venueName}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentDate(day.date);
                      setSelectedDayDate(day.dateStr);
                      setViewMode('day');
                    }}
                    className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline text-center w-full block cursor-pointer"
                  >
                    View Day &rarr;
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MONTHLY VIEW                                                          */}
      {/* ========================================================================= */}
      {viewMode === 'month' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Month Matrix (3 cols) */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden p-4 sm:p-5">
            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                <div key={i} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Day Cells Matrix */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {monthMatrix.map((week, wIdx) =>
                week.map((cell, cIdx) => {
                  const dayEvents = getEventsForDay(cell.dateStr);
                  const isSelected = cell.dateStr === selectedDayDate;

                  return (
                    <div
                      key={`${wIdx}-${cIdx}`}
                      onClick={() => setSelectedDayDate(cell.dateStr)}
                      className={`min-h-[64px] sm:min-h-[105px] p-1 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'ring-2 ring-blue-600 bg-blue-50/40 dark:bg-blue-950/30 border-blue-400'
                          : cell.isCurrentMonth
                          ? 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800 hover:border-blue-300'
                          : 'bg-transparent border-transparent opacity-30'
                      }`}
                    >
                      {/* Date Number Header */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center ${
                            cell.isToday
                              ? 'bg-blue-600 text-white shadow-xs'
                              : isSelected
                              ? 'text-blue-600 dark:text-blue-400 font-extrabold'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {cell.dayNumber}
                        </span>

                        {dayEvents.length > 0 && (
                          <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-700 px-1 sm:px-1.5 py-0.2 rounded-full">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      {/* Event Badges List */}
                      <div className="space-y-1 my-0.5 sm:my-1 overflow-hidden">
                        {/* Mobile Compact Dots */}
                        <div className="flex sm:hidden items-center justify-center gap-1 flex-wrap">
                          {dayEvents.slice(0, 3).map((evt) => (
                            <span
                              key={evt.id}
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                (evt.category || '').toLowerCase() === 'academic'
                                  ? 'bg-rose-500'
                                  : ['Hackathon', 'Ideathon'].includes(evt.eventType)
                                  ? 'bg-indigo-600'
                                  : 'bg-blue-500'
                              }`}
                            />
                          ))}
                          {dayEvents.length > 3 && (
                            <span className="text-[8px] font-bold text-blue-600 dark:text-blue-400">
                              +{dayEvents.length - 3}
                            </span>
                          )}
                        </div>

                        {/* Desktop Text Badges */}
                        <div className="hidden sm:block space-y-1">
                          {dayEvents.slice(0, 2).map((evt) => (
                            <div
                              key={evt.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEventForModal(evt);
                              }}
                              className={`text-[10px] font-medium px-1.5 py-0.5 rounded border truncate leading-tight transition-transform hover:opacity-80 ${getEventTypeColor(
                                evt
                              )}`}
                              title={`${evt.title} (${evt.startTime} at ${evt.venueName})`}
                            >
                              {evt.title}
                            </div>
                          ))}

                          {dayEvents.length > 2 && (
                            <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 text-center">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>

                      <div />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected Day Event Drawer (1 col) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 sm:p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Day Schedule
                  </span>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {formatDisplayDate(selectedDayDate)}
                  </h3>
                </div>
                <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-900">
                  {selectedDayEvents.length} Events
                </span>
              </div>

              {/* Events List for Selected Day */}
              {selectedDayEvents.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <CalendarIcon className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                  <p className="text-xs text-slate-400">No events scheduled for this day.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {selectedDayEvents.map((evt) => (
                    <div
                      key={evt.id}
                      onClick={() => setSelectedEventForModal(evt)}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-400 transition-all cursor-pointer space-y-1.5 group shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                          {evt.clubName || evt.organizerName}
                        </span>
                        <StatusBadge status={evt.status} size="sm" />
                      </div>

                      <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        {evt.title}
                      </h4>

                      <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>
                            {formatDisplayTime(evt.startTime)} – {formatDisplayTime(evt.endTime)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="truncate">{evt.venueName}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <button
                onClick={() => {
                  const [y, m, d] = selectedDayDate.split('-').map(Number);
                  setCurrentDate(new Date(y, (m || 1) - 1, d || 1));
                  setViewMode('day');
                }}
                className="text-blue-600 dark:text-blue-400 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Open Full Day View</span>
                <ArrowRight className="w-3 h-3" />
              </button>

              <span className="text-slate-400 text-[10px]">Click any event for pass</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
