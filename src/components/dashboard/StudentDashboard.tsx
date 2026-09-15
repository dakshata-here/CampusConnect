import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EventCard } from '../events/EventCard';
import {
  Calendar,
  Sparkles,
  Award,
  Users,
  Flame,
  Clock,
  ArrowRight,
  BookmarkCheck,
  CheckCircle2,
  GraduationCap,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Filter
} from 'lucide-react';
import { formatDisplayDate, formatDisplayTime, calculateTimeRemaining } from '../../utils/calendarUtils';

export const StudentDashboard: React.FC = () => {
  const {
    currentUser,
    events,
    registrations,
    clubs,
    certificates,
    setSelectedEventForModal,
    setActiveTab,
    setSelectedCertificate
  } = useApp();

  const [filterType, setFilterType] = useState<string>('all');

  // Compute student specific metrics
  const userRegs = registrations.filter((r) => r.studentId === currentUser.id);
  const registeredEventIds = userRegs.map((r) => r.eventId);
  const attendedCount = userRegs.filter((r) => r.attendanceStatus === 'attended').length;
  const userCertificates = certificates.filter((c) => c.studentId === currentUser.id);

  // Next upcoming registered event
  const upcomingRegisteredEvents = events
    .filter((e) => registeredEventIds.includes(e.id) && e.status !== 'completed' && e.status !== 'cancelled')
    .sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime());

  const nextRegisteredEvent = upcomingRegisteredEvents[0];
  const nextEventRemaining = nextRegisteredEvent
    ? calculateTimeRemaining(nextRegisteredEvent.date, nextRegisteredEvent.startTime)
    : null;

  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingTodayCount = events.filter(
    (e) => e.date === todayStr && ['published', 'approved', 'registration_open'].includes(e.status)
  ).length;

  // Filtered upcoming public events
  const publishedEvents = events.filter((e) => ['published', 'approved', 'registration_open'].includes(e.status));
  
  const filteredEvents = publishedEvents.filter((e) => {
    if (filterType === 'all') return true;
    if (filterType === 'hackathons') return ['Hackathon', 'Ideathon', 'Competition'].includes(e.eventType);
    if (filterType === 'workshops') return ['Workshop', 'SIG Session', 'Technical Event'].includes(e.eventType);
    if (filterType === 'academic') return e.category === 'academic';
    return true;
  });

  const featuredEvents = events.filter((e) => e.isDontMiss || e.currentRegistrations > 100);

  return (
    <div className="space-y-8">
      
      {/* Clean Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            Good Morning, {currentUser.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Here is what is happening across PICT campus today.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('events')}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <span>Explore Events</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Master Calendar</span>
          </button>
        </div>
      </div>

      {/* Metric Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('my-events')}
          className="dashboard-card p-4 rounded-xl border cursor-pointer hover:border-blue-300 dark:hover:border-blue-400 transition-colors"
        >
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Registered</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {userRegs.length < 10 ? `0${userRegs.length}` : userRegs.length}
          </p>
        </div>

        <div
          onClick={() => setActiveTab('calendar')}
          className="dashboard-card p-4 rounded-xl border cursor-pointer hover:border-blue-300 dark:hover:border-blue-400 transition-colors"
        >
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Upcoming Today</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {upcomingTodayCount < 10 ? `0${upcomingTodayCount}` : upcomingTodayCount}
          </p>
        </div>

        <div
          onClick={() => setActiveTab('my-clubs')}
          className="dashboard-card p-4 rounded-xl border cursor-pointer hover:border-blue-300 dark:hover:border-blue-400 transition-colors"
        >
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Campus Clubs</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {clubs.length < 10 ? `0${clubs.length}` : clubs.length}
          </p>
        </div>

        <div
          onClick={() => setActiveTab('certificates')}
          className="dashboard-card p-4 rounded-xl border cursor-pointer hover:border-blue-300 dark:hover:border-blue-400 transition-colors"
        >
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Certificates Earned</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {userCertificates.length < 10 ? `0${userCertificates.length}` : userCertificates.length}
          </p>
        </div>
      </div>

      {/* Exam Alert Box */}
      <div className="dashboard-card p-4 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="flex-1 text-xs">
          <p className="font-semibold text-sm text-blue-950 dark:text-blue-100">Semester Schedule Alert</p>
          <p className="mt-0.5 opacity-80">
            Mid-term exam timetables and compulsory academic deadlines have been synchronized into your master calendar view.
          </p>
        </div>
      </div>

      {/* Next Registered Event Countdown Card (if student registered) */}
      {nextRegisteredEvent && nextEventRemaining && (
        <div className="p-5 rounded-2xl dashboard-card border flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded uppercase">
                Up Next for You
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {nextRegisteredEvent.clubName}
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
              {nextRegisteredEvent.title}
            </h3>

            <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                {formatDisplayDate(nextRegisteredEvent.date)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {formatDisplayTime(nextRegisteredEvent.startTime)}
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                📍 {nextRegisteredEvent.venueName}
              </span>
            </div>
          </div>

          {/* Countdown Clock Box */}
          <div className="flex items-center gap-2 text-center bg-white/70 dark:bg-slate-800/80 p-3 rounded-xl border border-blue-200/70 dark:border-blue-500/40">
            <div className="p-1.5 min-w-[46px]">
              <div className="text-xl font-bold text-blue-600">
                {nextEventRemaining.days}
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Days</div>
            </div>
            <span className="text-base font-bold text-slate-300">:</span>
            <div className="p-1.5 min-w-[46px]">
              <div className="text-xl font-bold text-blue-600">
                {nextEventRemaining.hours}
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Hours</div>
            </div>
            <span className="text-base font-bold text-slate-300">:</span>
            <div className="p-1.5 min-w-[46px]">
              <div className="text-xl font-bold text-blue-600">
                {nextEventRemaining.minutes}
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Mins</div>
            </div>

            <button
              onClick={() => setSelectedEventForModal(nextRegisteredEvent)}
              className="ml-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors shrink-0 shadow-sm"
            >
              View Pass
            </button>
          </div>
        </div>
      )}

      {/* Featured / Don't Miss Carousel/Highlights */}
      {featuredEvents.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Featured & Priority Events
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Flagship hackathons, club sessions, and academic milestones
              </p>
            </div>

            <button
              onClick={() => setActiveTab('events')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>See all ({publishedEvents.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredEvents.slice(0, 3).map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* Main Events Feed & Filter */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Campus Activities
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Browse approved club events, academic milestones, and workshops
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium overflow-x-auto">
            {[
              { id: 'all', label: 'All Activities' },
              { id: 'workshops', label: 'Workshops & SIGs' },
              { id: 'hackathons', label: 'Hackathons & Contests' },
              { id: 'academic', label: 'Exams & Academic' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                  filterType === f.id
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center dashboard-card rounded-3xl border space-y-2">
            <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">No events found in this category</h3>
            <p className="text-xs text-slate-400">Try switching to 'All Activities' or checking the calendar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
