import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  Search,
  Bell,
  Sun,
  Moon,
  Plus,
  QrCode,
  CheckCheck,
  ChevronDown,
  LogOut,
  Sparkles,
  AlertCircle,
  Menu,
  X,
  Clock,
  MapPin,
  FileCheck
} from 'lucide-react';
import { formatDisplayDate, formatDisplayTime } from '../../utils/calendarUtils';

interface NavbarProps {
  onToggleMobileSidebar: () => void;
  onOpenAuthModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileSidebar, onOpenAuthModal }) => {
  const {
    currentUser,
    isDarkMode,
    toggleDarkMode,
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
    searchQuery,
    setSearchQuery,
    events,
    setSelectedEventForModal,
    activeTab,
    setActiveTab,
    setIsCreateEventOpen,
    setIsQrScannerOpen,
    registrationRequests,
    setSelectedRegistrationForReview,
    logout
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered search preview items
  const searchResults = searchQuery.trim()
    ? events.filter(
        (e) =>
          e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (e.clubName && e.clubName.toLowerCase().includes(searchQuery.toLowerCase())) ||
          e.eventType.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.venueName.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const userRoleBadge = {
    student: { label: 'Student', bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
    president: { label: 'Club President', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
    subhead: { label: 'Club Subhead', bg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' },
    college_admin: { label: 'College Admin', bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' }
  }[currentUser.role];

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
<<<<<<< HEAD
          {/* Left: Mobile Menu Toggle & Brand Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle navigation menu"
=======
          {/* Left: Sidebar Toggle Menu (three lines icon) & Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={onToggleMobileSidebar}
              className="p-2 -ml-1 sm:-ml-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
              aria-label="Toggle dashboard sidebar menu"
              title="Toggle Sidebar Navigation"
>>>>>>> eff49e3 (First commit)
            >
              <Menu className="w-5 h-5" />
            </button>

            <div
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-sm">
                C
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  CampusConnect
                </span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:inline">
                  PICT
                </span>
              </div>
            </div>
          </div>

          {/* Quick Header Nav Links (Desktop) */}
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-500 dark:text-slate-400">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`pb-1 transition-colors ${
                activeTab === 'dashboard'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`pb-1 transition-colors ${
                activeTab === 'calendar'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`pb-1 transition-colors ${
                activeTab === 'events'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Events
            </button>
            <button
              onClick={() => setActiveTab('my-clubs')}
              className={`pb-1 transition-colors ${
                activeTab === 'my-clubs'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Clubs
            </button>
            <button
              onClick={() => setActiveTab('venues-admin')}
              className={`pb-1 transition-colors ${
                activeTab === 'venues-admin'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Venues
            </button>
          </div>

          {/* Center/Right: Live Search */}
          <div className="flex-1 max-w-xs sm:max-w-sm relative hidden sm:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                placeholder="Search events, clubs, venues..."
                className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs pl-9 pr-8 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-blue-600 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Search Autocomplete Dropdown */}
            {isSearchFocused && searchQuery.trim() && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden z-50">
                <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Search Matches</span>
                  <span>{searchResults.length} found</span>
                </div>
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                    No matching events or clubs found.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                    {searchResults.map((item) => (
                      <div
                        key={item.id}
                        onMouseDown={() => {
                          setSelectedEventForModal(item);
                          setSearchQuery('');
                        }}
                        className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors flex items-start gap-2.5"
                      >
                        <div className="w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 text-[10px] font-bold">
                          {item.eventType.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span>{formatDisplayDate(item.date)}</span>
                            <span>•</span>
                            <span className="truncate">{item.venueName}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Action Icons & User Profile */}
          <div className="flex items-center gap-2">
            {/* Quick action button tailored to role */}
            {(currentUser.role === 'subhead' || currentUser.role === 'president') && (
              <button
                onClick={() => setIsCreateEventOpen(true)}
                className="hidden md:inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Propose Event</span>
              </button>
            )}

            {currentUser.role === 'college_admin' && (
              <button
                onClick={() => setIsCreateEventOpen(true)}
                className="hidden md:inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Event</span>
              </button>
            )}

            {/* Notification Bell with Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Notifications"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
                )}
              </button>

              {/* Notification Drawer */}
              {isNotifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50">
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                        Campus Notifications
                      </span>
                      {unreadNotificationsCount > 0 && (
                        <span className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          {unreadNotificationsCount} new
                        </span>
                      )}
                    </div>
                    {unreadNotificationsCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {(() => {
                      const userNotifications = notifications.filter(
                        (n) =>
                          (!n.userId || n.userId === currentUser.id) &&
                          (!n.userRole || n.userRole === currentUser.role)
                      );

                      if (userNotifications.length === 0) {
                        return (
                          <div className="p-6 text-center text-xs text-slate-400">
                            No notifications yet.
                          </div>
                        );
                      }

                      return userNotifications.map((notif) => {
                        const isRegRequest = notif.type === 'registration_request' || !!notif.registrationRequest || !!notif.registrationRequestId;
                        const regReq = notif.registrationRequest || (notif.registrationRequestId ? registrationRequests.find(r => r.id === notif.registrationRequestId) : undefined);
                        const applicantName = regReq ? regReq.fullName : notif.title;
                        const regStatus = regReq?.status;

                        return (
                          <div
                            key={notif.id}
                            onClick={() => {
                              markNotificationRead(notif.id);
                              if (notif.eventId) {
                                const found = events.find((e) => e.id === notif.eventId);
                                if (found) setSelectedEventForModal(found);
                              }
                            }}
                            className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                              !notif.isRead
                                ? isRegRequest
                                  ? 'bg-purple-50/50 dark:bg-purple-950/20'
                                  : 'bg-blue-50/50 dark:bg-blue-950/20'
                                : ''
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                <div
                                  className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${
                                    isRegRequest ? 'bg-purple-500' : 'bg-blue-500'
                                  }`}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1 flex-wrap">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                        {applicantName}
                                      </h5>
                                      {regStatus && (
                                        <span
                                          className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-sm ${
                                            regStatus === 'approved'
                                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                              : regStatus === 'rejected'
                                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                          }`}
                                        >
                                          {regStatus}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-slate-400 shrink-0">
                                      {new Date(notif.createdAt).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                                    {notif.message}
                                  </p>
                                </div>
                              </div>

                              {/* On the right of that notified line: Review option for Admin only */}
                              {currentUser.role === 'college_admin' && isRegRequest && (regReq || notif.registrationRequest) && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markNotificationRead(notif.id);
                                    const target = regReq || notif.registrationRequest;
                                    if (target) {
                                      setSelectedRegistrationForReview(target);
                                    }
                                    setIsNotifOpen(false);
                                  }}
                                  className="shrink-0 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                                >
                                  Review
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Dark/Light mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* User Profile Pill & Dropdown */}
            <div className="relative pl-2 border-l border-slate-200 dark:border-slate-800" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200">
                  {currentUser.name.split(' ').map(n => n[0]).join('')}
                </div>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 hidden sm:inline">
                  {currentUser.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile Menu Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-2 z-50">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      {currentUser.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {currentUser.email}
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <FileCheck className="w-4 h-4 text-blue-600" />
                      <span>Profile & Certificates</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('calendar');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>Full Calendar View</span>
                    </button>
                  </div>

                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out / Return to Home</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
