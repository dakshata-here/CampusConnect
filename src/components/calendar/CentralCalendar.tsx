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
  Flame,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import {
  getMonthMatrix,
  formatDisplayTime,
  formatDisplayDate,
  formatMonthYear
} from '../../utils/calendarUtils';
import { StatusBadge } from '../common/StatusBadge';

export const CentralCalendar: React.FC = () => {
  const { events, clubs, academicNotices, setSelectedEventForModal } = useApp();

  const [currentDate, setCurrentDate] = useState(new Date('2026-09-01'));
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedClubFilter, setSelectedClubFilter] = useState<string>('all');
  const [selectedDayDate, setSelectedDayDate] = useState<string>('2026-09-18');

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  const goToToday = () => {
    setCurrentDate(new Date('2026-09-15'));
  };

  const monthMatrix = getMonthMatrix(currentDate.getFullYear(), currentDate.getMonth());

  // Convert academic notices into calendar display format
  const academicCalendarEvents: CampusEvent[] = (academicNotices || [])
    .filter((n) => n.status === 'Published' || n.addedToCalendar)
    .map((n) => ({
      id: n.id,
      title: n.title,
      eventType: (['Examination', 'Practical Examination', 'End Sem Exam', 'Internal Exam'].includes(n.eventType) ? 'Internal Exam' : n.eventType === 'Holiday' ? 'Holiday' : 'Academic') as any,
      category: 'academic',
      academicType: ['Examination', 'Practical Examination'].includes(n.eventType) ? 'exam' : n.eventType === 'Holiday' ? 'holiday' : 'deadline',
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

  // Filter events based on active layers - Only Admin-approved events are displayed on the calendar
  const visibleEvents = allEventsForCalendar.filter((e) => {
    const isApproved = ['approved', 'published', 'registration_open', 'registration_closed', 'completed', 'live', 'postponed'].includes(e.status);
    if (!isApproved) return false;

    // Category / Layer filter
    if (selectedFilter === 'academic' && e.category !== 'academic') return false;
    if (selectedFilter === 'club' && e.category !== 'club') return false;
    if (selectedFilter === 'exams' && !['Internal Exam', 'End Sem Exam'].includes(e.eventType)) return false;

    // Club filter
    if (selectedClubFilter !== 'all' && e.clubId !== selectedClubFilter) return false;

    return true;
  });

  const getEventsForDay = (dateStr: string) => {
    return visibleEvents.filter((e) => e.date === dateStr);
  };

  const selectedDayEvents = visibleEvents.filter((e) => e.date === selectedDayDate);

  const getEventTypeColor = (e: CampusEvent) => {
    if (e.category === 'academic') {
      if (['Internal Exam', 'End Sem Exam'].includes(e.eventType)) {
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30';
      }
      return 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30';
    }
    if (['Hackathon', 'Ideathon', 'Competition'].includes(e.eventType)) {
      return 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30';
    }
    if (['Workshop', 'SIG Session'].includes(e.eventType)) {
      return 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30';
    }
    return 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30';
  };

  return (
    <div className="space-y-6">
      
      {/* Top Controls Header */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Month & Nav */}
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 min-w-[180px]">
              {formatMonthYear(currentDate)}
            </h2>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goToToday}
                className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded transition-colors"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* View Mode & Club Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Layer Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
              {[
                { id: 'all', label: 'All Events' },
                { id: 'club', label: 'Clubs Only' },
                { id: 'academic', label: 'Academic & Exams' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    selectedFilter === tab.id
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Club Specific Filter Dropdown */}
            <select
              value={selectedClubFilter}
              onChange={(e) => setSelectedClubFilter(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium py-1.5 px-3 rounded-lg border-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Clubs ({clubs.length})</option>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.shortName} - {c.name}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Calendar Key:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            Hackathons & Contests
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            Workshops & SIGs
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Exams & Project Submissions
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            Academic Notices
          </span>
        </div>
      </div>

      {/* Main Calendar Matrix & Side Day-List Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Month Grid (3 cols on large screen) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-4 sm:p-5">
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
                    className={`min-h-[85px] sm:min-h-[105px] p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
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
                        className={`text-xs font-bold w-6 h-6 rounded-md flex items-center justify-center ${
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
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-200/70 dark:bg-slate-700 px-1.5 py-0.2 rounded-full">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Event Badges List */}
                    <div className="space-y-1 my-1 overflow-hidden">
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
                          {evt.isDontMiss && '🔥 '}
                          {evt.title}
                        </div>
                      ))}

                      {dayEvents.length > 2 && (
                        <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 text-center">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>

                    <div />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Day Event Drawer (1 col) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Daily Schedule
                </span>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  {formatDisplayDate(selectedDayDate)}
                </h3>
              </div>
              <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-900">
                {selectedDayEvents.length} Events
              </span>
            </div>

            {/* Events List for Day */}
            {selectedDayEvents.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <CalendarIcon className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                <p className="text-xs text-slate-400">No events scheduled for this day.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {selectedDayEvents.map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEventForModal(evt)}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-400 transition-all cursor-pointer space-y-1.5 group shadow-xs"
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
                        <span>{formatDisplayTime(evt.startTime)} – {formatDisplayTime(evt.endTime)}</span>
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

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>Click any event to view details, register, or download .ICS.</span>
          </div>
        </div>

      </div>

    </div>
  );
};
