import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar as CalendarIcon,
  Sparkles,
  ShieldCheck,
  QrCode,
  Bell,
  Clock,
  CheckCircle2,
  Users,
  Award,
  ArrowRight,
  ChevronRight,
  Search,
  Building2,
  GraduationCap,
  MapPin,
  FileCheck,
  BookOpen,
  CalendarCheck2,
  Lock,
  ExternalLink,
  Laptop
} from 'lucide-react';
import { formatDisplayDate, formatDisplayTime } from '../../utils/calendarUtils';

interface LandingPageProps {
  onOpenAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  const {
    events,
    clubs,
    venues,
    setActiveTab,
    setSelectedEventForModal,
    switchUser,
    allUsers,
    searchQuery,
    setSearchQuery
  } = useApp();

  const [categoryFilter, setCategoryFilter] = useState<'all' | 'workshops' | 'hackathons' | 'academic'>('all');
  const [websiteSearch, setWebsiteSearch] = useState('');

  // Approved live events
  const approvedEvents = events.filter((e) =>
    ['published', 'approved', 'registration_open', 'completed'].includes(e.status)
  );

  const filteredEvents = approvedEvents.filter((e) => {
    const matchesSearch = websiteSearch.trim() === '' ||
      e.title.toLowerCase().includes(websiteSearch.toLowerCase()) ||
      (e.clubName && e.clubName.toLowerCase().includes(websiteSearch.toLowerCase())) ||
      e.eventType.toLowerCase().includes(websiteSearch.toLowerCase()) ||
      e.venueName.toLowerCase().includes(websiteSearch.toLowerCase());

    if (!matchesSearch) return false;

    if (categoryFilter === 'workshops') return ['Workshop', 'SIG Session', 'Technical Event'].includes(e.eventType);
    if (categoryFilter === 'hackathons') return ['Hackathon', 'Ideathon', 'Competition'].includes(e.eventType);
    if (categoryFilter === 'academic') return e.category === 'academic';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      
      {/* College Institutional Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Institution Name */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-xs">
              P
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-slate-900 dark:text-slate-100 tracking-tight">
                  Pune Institute of Computer Technology
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hidden sm:inline">
                  PICT Events
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Official Campus Calendar & Student Activities Portal
              </p>
            </div>
          </div>

          {/* Website Quick Navigation */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <a href="#events" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Campus Events
            </a>
            <button
              onClick={() => setActiveTab('calendar')}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Master Calendar
            </button>
            <a href="#clubs" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Clubs & Chapters
            </a>
            <button
              onClick={() => setActiveTab('venues-admin')}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Venues & Halls
            </button>
            <a href="#portals" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Portals
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveTab('calendar')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>Full Calendar</span>
            </button>

            <button
              onClick={() => setActiveTab('login')}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>Login / Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* College Notice Bar / Ticker */}
      <div className="bg-slate-900 text-slate-200 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase shrink-0">
              Notice
            </span>
            <span className="text-slate-300 text-xs">
              Registrations active for IEEE Impetus and ACM Pune Hackathon 2026. Official exam schedule published.
            </span>
          </div>
          <div className="text-[11px] text-slate-400 hidden sm:block shrink-0">
            Academic Year 2025–2026
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-7 space-y-5 text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Centralized Campus Life & Event Infrastructure</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              One Unified Calendar for All College Events, Workshops & Exams
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
              Discover verified technical hackathons, SIG sessions, robotics bootcamps, and official academic examination schedules in one verified campus network with 1-click registration and automated certificate generation.
            </p>

            {/* Quick search input */}
            <div className="pt-2 max-w-lg">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search workshops, hackathons, clubs, or venues..."
                  value={websiteSearch}
                  onChange={(e) => setWebsiteSearch(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs pl-9 pr-24 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-xs"
                />
                <button
                  onClick={() => {
                    const el = document.getElementById('events');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Key Quick Facts */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">06+</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Technical Chapters</p>
              </div>
              <div>
                <p className="text-xl font-bold text-blue-600">100%</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Verified QR Passes</p>
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">0%</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Venue Clashes</p>
              </div>
            </div>
          </div>

          {/* Hero Side Widget: Quick Persona Jump & Portal Selector */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Interactive Demo Access
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  Select User Portal & Persona
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 text-[10px] font-bold">
                1-Click Login
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {allUsers.map((u) => {
                const roleDisplay = {
                  student: { label: 'Student Portal', desc: 'Browse, register, get QR & certs' },
                  president: { label: 'President Portal', desc: 'Review & approve club proposals' },
                  subhead: { label: 'Subhead Desk', desc: 'Draft proposals & check halls' },
                  college_admin: { label: 'Admin Gateway', desc: 'Master calendar & hall control' }
                }[u.role];

                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUser(u.id);
                      setActiveTab('dashboard');
                    }}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 hover:border-blue-300 dark:hover:border-blue-800 text-left transition-colors flex flex-col justify-between space-y-2 group"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                          {u.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {roleDisplay?.label}
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {roleDisplay?.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Role-based access control
              </span>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                Go to Dashboard →
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Featured Campus Events Section */}
      <section id="events" className="py-12 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                Live & Upcoming Campus Activities
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Official approved workshops, hackathons, SIG sessions, and milestone tests
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-semibold overflow-x-auto">
              {[
                { id: 'all', label: 'All Activities' },
                { id: 'workshops', label: 'Workshops & SIGs' },
                { id: 'hackathons', label: 'Hackathons' },
                { id: 'academic', label: 'Academic Dates' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCategoryFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                    categoryFilter === tab.id
                      ? 'bg-blue-600 text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEvents.map((evt) => (
              <div
                key={evt.id}
                onClick={() => setSelectedEventForModal(evt)}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={evt.posterUrl}
                      alt={evt.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider">
                        {evt.eventType}
                      </span>
                      {evt.category === 'academic' && (
                        <span className="px-2 py-0.5 rounded bg-purple-600 text-white text-[10px] font-bold uppercase tracking-wider">
                          Academic
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <span>{evt.clubName || evt.organizerName}</span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {evt.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {evt.shortDescription}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0 space-y-3">
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDisplayDate(evt.date)}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{evt.startTime} – {evt.endTime}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{evt.venueName}</span>
                      </span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400 shrink-0">
                        {evt.currentRegistrations}/{evt.maxParticipants} Registered
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEventForModal(evt);
                    }}
                    className="w-full py-2 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>View Details & Register</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => setActiveTab('events')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors"
            >
              <span>Explore All {events.length} Campus Events</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </section>

      {/* Clubs & Student Chapters Section */}
      <section id="clubs" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Student Clubs & Technical Chapters
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Recognized student organizations hosting weekly workshops, competitions, and technical sessions
            </p>
          </div>

          <button
            onClick={() => setActiveTab('my-clubs')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 self-start sm:self-center"
          >
            <span>View Full Directory ({clubs.length})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {clubs.map((c) => {
            const clubEvts = events.filter((e) => e.clubId === c.id && e.status !== 'draft');
            return (
              <div
                key={c.id}
                className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <img
                      src={c.logo}
                      alt={c.name}
                      className="w-12 h-12 rounded-lg object-cover p-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {c.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {c.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {c.description}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Lead: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{c.presidentName.split(' ')[0]}</strong></span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{clubEvts.length} Activities</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Portals & Institutional Access Section */}
      <section id="portals" className="py-12 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Campus Workflow & Portals
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Designed specifically for engineering institutions with role-based segregation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold text-sm">
                🎓
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Student Portal</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Discover events, register with 1-click, store verified QR passes, and download participation certificates.
              </p>
              <button
                onClick={() => {
                  switchUser('user_rahul');
                  setActiveTab('dashboard');
                }}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 pt-1"
              >
                <span>Open as Student</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-600 flex items-center justify-center font-bold text-sm">
                🛠️
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Subhead Workspace</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Submit new event proposals with automated venue conflict checking and real-time revision tracking.
              </p>
              <button
                onClick={() => {
                  switchUser('user_ananya');
                  setActiveTab('dashboard');
                }}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 pt-1"
              >
                <span>Open as Subhead</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center font-bold text-sm">
                👑
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">President Control</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Review and approve proposals, manage attendee quotas, and track verified student participation.
              </p>
              <button
                onClick={() => {
                  switchUser('user_aarav');
                  setActiveTab('dashboard');
                }}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 pt-1"
              >
                <span>Open as President</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold text-sm">
                🏛️
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">College Administration</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Publish academic notices, resolve venue conflicts across auditorium/labs, and oversee institutional calendar.
              </p>
              <button
                onClick={() => {
                  switchUser('user_admin');
                  setActiveTab('dashboard');
                }}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 pt-1"
              >
                <span>Open as Admin</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Institutional Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                P
              </div>
              <span className="font-bold text-sm text-white">Pune Institute of Computer Technology</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Survey No. 27, Near Trimurti Chowk, Bharati Vidyapeeth Campus, Dhankawadi, Pune, Maharashtra 411043.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-white uppercase text-[11px] tracking-wider">Quick Navigation</h4>
            <ul className="space-y-1.5">
              <li>
                <button onClick={() => setActiveTab('events')} className="hover:text-white transition-colors">
                  Campus Events
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('calendar')} className="hover:text-white transition-colors">
                  Master Calendar
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('my-clubs')} className="hover:text-white transition-colors">
                  Clubs & SIGs
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('venues-admin')} className="hover:text-white transition-colors">
                  Venues Directory
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-white uppercase text-[11px] tracking-wider">Campus Portals</h4>
            <ul className="space-y-1.5">
              <li>
                <button onClick={() => { switchUser('user_rahul'); setActiveTab('dashboard'); }} className="hover:text-white transition-colors">
                  Student Portal
                </button>
              </li>
              <li>
                <button onClick={() => { switchUser('user_aarav'); setActiveTab('dashboard'); }} className="hover:text-white transition-colors">
                  Club President Desk
                </button>
              </li>
              <li>
                <button onClick={() => { switchUser('user_ananya'); setActiveTab('dashboard'); }} className="hover:text-white transition-colors">
                  Subhead Workspace
                </button>
              </li>
              <li>
                <button onClick={() => { switchUser('user_admin'); setActiveTab('dashboard'); }} className="hover:text-white transition-colors">
                  Administration Gateway
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-white uppercase text-[11px] tracking-wider">Student Activities Cell</h4>
            <p className="text-slate-400">
              Email: events@pict.edu<br />
              Helpdesk: +91 20 2437 1101<br />
              Ext: 245 (Student Activities Office)
            </p>
          </div>

        </div>

        <div className="border-t border-slate-800 py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <p>© 2026 Pune Institute of Computer Technology. CampusConnect System.</p>
          <p>Academic & Student Club Management Network</p>
        </div>
      </footer>

    </div>
  );
};
