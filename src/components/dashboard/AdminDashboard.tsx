import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import {
  ShieldCheck,
  Building2,
  Calendar,
  Users,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Download,
  Plus,
  ArrowRight,
  GraduationCap,
  Sparkles,
  Search,
  FileSpreadsheet,
  Bell,
  UserCheck
} from 'lucide-react';
import { formatDisplayDate, formatDisplayTime } from '../../utils/calendarUtils';

export const AdminDashboard: React.FC = () => {
  const {
    currentUser,
    events,
    clubs,
    venues,
    registrations,
    certificates,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    registrationRequests,
    setSelectedRegistrationForReview,
    setSelectedEventForApproval,
    setSelectedEventForModal,
    setIsCreateEventOpen,
    setActiveTab
  } = useApp();

  const [searchFilter, setSearchFilter] = useState('');
  const [isAdminNotifOpen, setIsAdminNotifOpen] = useState(false);

  const adminNotifications = notifications.filter(
    (n) => (!n.userId || n.userId === currentUser.id) && (!n.userRole || n.userRole === currentUser.role)
  );
  const unreadAdminCount = adminNotifications.filter((n) => !n.isRead).length;

  const pendingApprovals = events.filter((e) => e.status === 'pending_approval');
  const publishedEvents = events.filter((e) => ['published', 'approved', 'registration_open'].includes(e.status));
  const academicEvents = events.filter((e) => e.category === 'academic');

  const exportCsvReport = () => {
    const headers = 'Event ID,Title,Category,Type,Club,Date,StartTime,EndTime,Venue,Registrations,MaxCapacity,Status\n';
    const rows = events.map((e) =>
      `"${e.id}","${e.title}","${e.category}","${e.eventType}","${e.clubName || 'College'}","${e.date}","${e.startTime}","${e.endTime}","${e.venueName}",${e.currentRegistrations},${e.maxParticipants},"${e.status}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CampusConnect_Institutional_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      
      {/* Admin Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white border border-purple-900/50 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-purple-400 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              College Administration Panel
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
              Institutional Authority
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Campus Administrator Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Supervise all engineering college clubs, publish academic timetables & examination notices, override venue allocations, and generate compliance reports.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Notification Icon on Admin Dashboard */}
          <div className="relative">
            <button
              onClick={() => setIsAdminNotifOpen(!isAdminNotifOpen)}
              className="px-4 py-2.5 rounded-xl bg-purple-900/70 hover:bg-purple-800 text-white font-bold text-xs border border-purple-700/60 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Bell className="w-4 h-4 text-purple-300" />
              <span>Notifications</span>
              {unreadAdminCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-400 text-purple-950 font-black text-[10px] rounded-full">
                  {unreadAdminCount}
                </span>
              )}
            </button>

            {isAdminNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="p-3.5 bg-gradient-to-r from-purple-900 to-indigo-950 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-purple-300" />
                    <span className="font-bold text-xs">Admin Notifications</span>
                    {unreadAdminCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-purple-500/40 text-[10px] font-bold">
                        {unreadAdminCount} new
                      </span>
                    )}
                  </div>
                  {unreadAdminCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[11px] text-purple-200 hover:text-white underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {adminNotifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No notifications yet.
                    </div>
                  ) : (
                    adminNotifications.map((notif) => {
                      const isRegRequest = notif.type === 'registration_request' || !!notif.registrationRequest || !!notif.registrationRequestId;
                      const regReq = notif.registrationRequest || (notif.registrationRequestId ? registrationRequests.find(r => r.id === notif.registrationRequestId) : undefined);
                      const applicantName = regReq ? regReq.fullName : notif.title;
                      const regStatus = regReq?.status;

                      return (
                        <div
                          key={notif.id}
                          className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                            !notif.isRead ? 'bg-purple-50/50 dark:bg-purple-950/20' : ''
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
                            {isRegRequest && (regReq || notif.registrationRequest) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markNotificationRead(notif.id);
                                  const target = regReq || notif.registrationRequest;
                                  if (target) {
                                    setSelectedRegistrationForReview(target);
                                  }
                                  setIsAdminNotifOpen(false);
                                }}
                                className="shrink-0 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                              >
                                Review
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={exportCsvReport}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-purple-400" />
            <span>Export CSV Report</span>
          </button>

          <button
            onClick={() => setIsCreateEventOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Academic / College Event</span>
          </button>
        </div>
      </div>

      {/* KPI Institutional Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl dashboard-card border transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Affiliated Clubs</span>
            <Building2 className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            {clubs.length}
          </div>
        </div>

        <div
          onClick={() => setActiveTab('events-admin')}
          className="p-5 rounded-2xl dashboard-card border hover:shadow-md cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Total Events</span>
            <Calendar className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            {events.length}
          </div>
        </div>

        <div className="p-5 rounded-2xl dashboard-card border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Total Student Seats</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            {registrations.length}
          </div>
        </div>

        <div
          onClick={() => setActiveTab('venues-admin')}
          className="p-5 rounded-2xl dashboard-card border hover:shadow-md cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Active Venues</span>
            <MapPin className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            {venues.length}
          </div>
        </div>
      </div>

      {/* Registration Requests Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <UserCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                Club Lead & Admin Registration Requests ({registrationRequests.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Review applicant identity, verification details, and assign Approve, Reject, or Pending status
              </p>
            </div>
          </div>
        </div>

        {registrationRequests.length === 0 ? (
          <div className="p-6 text-center dashboard-card rounded-3xl border space-y-1">
            <p className="text-xs text-slate-400">No registration requests found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {registrationRequests.map((req) => (
              <div
                key={req.id}
                className="p-5 rounded-3xl dashboard-card border border-purple-200 dark:border-purple-900/60 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                          {req.fullName}
                        </h4>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                            req.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : req.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-0.5">
                        {req.role === 'admin'
                          ? 'Institutional Admin Role'
                          : `Club Lead • ${req.clubName || 'PICT Club'}`}
                      </p>
                    </div>

                    <span className="text-[10px] text-slate-400">
                      {new Date(req.submittedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    <div>
                      <span className="block font-medium">ID / PRN:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{req.idNumber}</span>
                    </div>
                    <div>
                      <span className="block font-medium">Email:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{req.email}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {req.leadType ? `Coordinator: ${req.leadType}` : 'Admin Authority'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedRegistrationForReview(req)}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>Review Application</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cross-Club Approvals Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600">
              <CheckCircle2 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                Cross-Club Pending Approvals ({pendingApprovals.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Institutional admin can review or override approval for any club event
              </p>
            </div>
          </div>
        </div>

        {pendingApprovals.length === 0 ? (
          <div className="p-8 text-center dashboard-card rounded-3xl border space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">All Approvals Clear</h3>
            <p className="text-xs text-slate-400">No pending event proposals across any campus club.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingApprovals.map((evt) => (
              <div
                key={evt.id}
                className="p-5 rounded-3xl dashboard-card border border-purple-200 dark:border-purple-900/60 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded-full">
                      {evt.clubName || 'College Academic'}
                    </span>
                    <StatusBadge status={evt.status} size="sm" />
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                    {evt.title}
                  </h3>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>📅 {formatDisplayDate(evt.date)}</div>
                    <div>⏰ {formatDisplayTime(evt.startTime)}</div>
                    <div className="col-span-2">📍 {evt.venueName}</div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedEventForApproval(evt)}
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <span>Admin Review & Decision</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Campus Venues Overview Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
              Campus Venues & Booking Capacities
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Monitor hall readiness, equipment, and occupancy limits
            </p>
          </div>

          <button
            onClick={() => setActiveTab('venues-admin')}
            className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
          >
            Manage Venues →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {venues.map((venue) => {
            const venueEvents = events.filter((e) => e.venueId === venue.id && e.status !== 'cancelled');
            return (
              <div
                key={venue.id}
                className="p-5 rounded-3xl dashboard-card border space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                      {venue.name}
                    </h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {venue.building} • {venue.floor}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-full">
                    Cap: {venue.capacity}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {venue.facilities.map((fac, i) => (
                    <span key={i} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                      {fac}
                    </span>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center justify-between">
                  <span>Scheduled Events:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{venueEvents.length} events</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
