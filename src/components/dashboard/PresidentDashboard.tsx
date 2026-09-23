import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { CampusEvent } from '../../types';
import {
  LayoutDashboard,
  Clock,
  CheckCircle2,
  Users,
  Calendar,
  AlertTriangle,
  Plus,
  ArrowRight,
  TrendingUp,
  MapPin,
  Building2,
  Award,
  FileCheck,
  FileText,
  BarChart3,
  Edit3,
  Send,
  X,
  Mail
} from 'lucide-react';
import { formatDisplayDate, formatDisplayTime, detectEventConflicts } from '../../utils/calendarUtils';

export const PresidentDashboard: React.FC = () => {
  const {
    currentUser,
    events,
    registrations,
    clubs,
    certificates,
    setSelectedEventForApproval,
    setSelectedEventForModal,
    setIsCreateEventOpen,
    setActiveTab,
    leadRequestChangesOnApproved,
    resubmitEventProposal
  } = useApp();

  const myClub = clubs.find((c) => c.id === currentUser.clubId) || clubs[0];
  const clubEvents = events.filter((e) => e.clubId === myClub.id);

  // Local state for requesting changes on an approved event
  const [changeModalEvent, setChangeModalEvent] = useState<CampusEvent | null>(null);
  const [changeReason, setChangeReason] = useState<string>('');

  // Status breakdown
  const pendingProposals = clubEvents.filter(
    (e) => e.status === 'pending_approval' || e.status === 'changes_requested'
  );
  const publishedEvents = clubEvents.filter((e) => ['published', 'approved', 'registration_open'].includes(e.status));
  const completedEvents = clubEvents.filter((e) => e.status === 'completed');

  // Club registration stats
  const clubEventIds = clubEvents.map((e) => e.id);
  const clubRegistrations = registrations.filter((r) => clubEventIds.includes(r.eventId));
  const totalAttended = clubRegistrations.filter((r) => r.attendanceStatus === 'attended').length;
  const clubCertificates = certificates.filter((c) => c.clubName === myClub.name);

  const handleOpenChangeModal = (evt: CampusEvent) => {
    setChangeModalEvent(evt);
    setChangeReason(
      evt.changeComments?.[0] || 'Need to update speaker schedule, venue arrangement, and banner details.'
    );
  };

  const handleConfirmLeadChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeModalEvent || !changeReason.trim()) return;

    leadRequestChangesOnApproved(changeModalEvent.id, changeReason.trim());
    setChangeModalEvent(null);
    setChangeReason('');
  };

  const handleResubmit = (evt: CampusEvent) => {
    resubmitEventProposal(evt.id, {
      changeComments: ['Updated and re-submitted to Admin for approval.']
    });
  };

  return (
    <div className="space-y-8">
      
      {/* Club Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <img
            src={myClub.logo}
            alt={myClub.name}
            className="w-12 h-12 rounded-xl object-cover bg-white p-1 border border-slate-200 dark:border-slate-700 shadow-xs"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                President Portal
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 text-[10px] font-bold border border-blue-100 dark:border-blue-900">
                Official Lead
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {myClub.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsCreateEventOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Propose Event</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('event-requests')}
          className="p-4 rounded-xl dashboard-card border cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-all hover:scale-[1.01]"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pending Reviews</p>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {pendingProposals.length < 10 ? `0${pendingProposals.length}` : pendingProposals.length}
            </span>
            {pendingProposals.length > 0 && (
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Action required</span>
            )}
          </div>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold block mt-1">
            Submitted Proposals &rarr;
          </span>
        </div>

        <div
          onClick={() => setActiveTab('analytics')}
          className="p-4 rounded-xl dashboard-card border cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-all hover:scale-[1.01]"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Club Events</p>
            <BarChart3 className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {clubEvents.length < 10 ? `0${clubEvents.length}` : clubEvents.length}
          </p>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold block mt-1">
            View Analytics &rarr;
          </span>
        </div>

        <div
          onClick={() => setActiveTab('registrations')}
          className="p-4 rounded-xl dashboard-card border cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-all hover:scale-[1.01]"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Registrations</p>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {clubRegistrations.length}
          </p>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold block mt-1">
            Attendee Registry & Mailer &rarr;
          </span>
        </div>

        <div
          onClick={() => setActiveTab('members')}
          className="p-4 rounded-xl dashboard-card border cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-all hover:scale-[1.01]"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Club Members</p>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {myClub.memberCount || 24}
          </p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">
            Lead Chat & Tasks &rarr;
          </span>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div
          onClick={() => setActiveTab('event-requests')}
          className="p-3.5 rounded-2xl dashboard-card border cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-all hover:scale-[1.01] flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
              Submitted Proposals
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              Review status & change requests
            </p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('members')}
          className="p-3.5 rounded-2xl dashboard-card border cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-all hover:scale-[1.01] flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
              Club Members
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              Chat with Lead & Task lists
            </p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('registrations')}
          className="p-3.5 rounded-2xl dashboard-card border cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-all hover:scale-[1.01] flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/80 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
              Registrations
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              Separate cards & attendee mailer
            </p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('analytics')}
          className="p-3.5 rounded-2xl dashboard-card border cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-all hover:scale-[1.01] flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
              Club Analytics
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              Popularity chart & monthly stats
            </p>
          </div>
        </div>
      </div>

      {/* Action Required: Pending Approval Queue */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Event Proposals Submitted for Admin Approval ({pendingProposals.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Proposals submitted to College Admin for review. Events are published to the campus calendar once approved by the Admin.
          </p>
        </div>

        {pendingProposals.length === 0 ? (
          <div className="p-6 text-center dashboard-card rounded-xl border space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">No Pending Admin Approval Requests</h3>
            <p className="text-xs text-slate-400">All proposals for your club have been reviewed by the Admin or published.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingProposals.map((evt) => {
              const conflict = detectEventConflicts(
                {
                  id: evt.id,
                  date: evt.date,
                  startTime: evt.startTime,
                  endTime: evt.endTime,
<<<<<<< HEAD
                  venueId: evt.venueId
=======
                  venueId: evt.venueId,
                  venueName: evt.venueName
>>>>>>> eff49e3 (First commit)
                },
                events
              );

              const isChangesRequested = evt.status === 'changes_requested';

              return (
                <div
                  key={evt.id}
                  className={`p-4 rounded-xl dashboard-card border space-y-3 flex flex-col justify-between ${
                    isChangesRequested
                      ? 'border-orange-300 dark:border-orange-800/80 ring-1 ring-orange-200 dark:ring-orange-900/40'
                      : ''
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded">
                        {evt.eventType}
                      </span>
                      <StatusBadge status={evt.status} size="sm" />
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {evt.title}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {evt.shortDescription}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>📅 {formatDisplayDate(evt.date)}</div>
                      <div>⏰ {formatDisplayTime(evt.startTime)}</div>
                      <div className="col-span-2 font-medium text-slate-700 dark:text-slate-300">
                        📍 {evt.venueName}
                      </div>
                      <div className="col-span-2 text-[11px] text-slate-400">
                        Proposed by: <span className="font-semibold text-slate-600 dark:text-slate-300">{evt.createdByName}</span>
                      </div>
                    </div>

                    {/* Status Notice */}
                    {isChangesRequested ? (
                      <div className="p-2.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 border border-orange-300 dark:border-orange-800 text-[11px] text-orange-900 dark:text-orange-200 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                          <span>College Admin Requested Changes:</span>
                        </div>
                        <p className="italic text-orange-800 dark:text-orange-300 line-clamp-2">
                          "{evt.changeComments?.[0] || 'Please review proposal details.'}"
                        </p>
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Approval Sent to Admin (Awaiting Admin Decision)</span>
                      </div>
                    )}

                    {conflict.hasConflict && (
<<<<<<< HEAD
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
=======
                      <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-[11px] text-rose-800 dark:text-rose-300 flex items-center gap-1.5 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
>>>>>>> eff49e3 (First commit)
                        <span className="truncate">{conflict.message}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedEventForApproval(evt)}
                    className={`w-full py-2 px-3 rounded-lg font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 ${
                      isChangesRequested
                        ? 'bg-orange-600 hover:bg-orange-700 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>
                      {isChangesRequested
                        ? "Review & Resubmit for Admin's Approval"
                        : 'View Proposal Status'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Club Events Table */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Published & Completed Events ({publishedEvents.length + completedEvents.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage live attendee capacity, scan check-ins, and view feedback
          </p>
        </div>

        <div className="dashboard-card rounded-xl border overflow-hidden">
          <div className="divide-y divide-blue-100/70 dark:divide-slate-800">
            {clubEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-sky-50/50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <img
                    src={evt.posterUrl}
                    alt={evt.title}
                    className="w-12 h-12 rounded-lg object-cover shrink-0 shadow-xs"
                  />
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        {evt.eventType}
                      </span>
                      <StatusBadge status={evt.status} size="sm" />
                    </div>
                    <h4
                      onClick={() => setSelectedEventForModal(evt)}
                      className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer truncate"
                    >
                      {evt.title}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      <span>{formatDisplayDate(evt.date)}</span>
                      <span>•</span>
                      <span>{evt.venueName}</span>
                      <span>•</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {evt.currentRegistrations} / {evt.maxParticipants} Registered
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
                  {/* If Event is Approved/Published, Club Lead can request changes */}
                  {(evt.status === 'approved' || evt.status === 'published' || evt.status === 'registration_open') && (
                    <button
                      onClick={() => handleOpenChangeModal(evt)}
                      className="px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/60 dark:hover:bg-orange-900 text-orange-700 dark:text-orange-300 text-xs font-bold border border-orange-200 dark:border-orange-800 transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-orange-600" />
                      <span>Required Changes</span>
                    </button>
                  )}

                  {/* If Changes are requested, show Re-submit to Admin */}
                  {evt.status === 'changes_requested' && (
                    <button
                      onClick={() => handleResubmit(evt)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Re-submit to Admin</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedEventForModal(evt)}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs font-semibold transition-colors"
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Required Changes Modal for Club Lead */}
      {changeModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-blue-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Required Changes on "{changeModalEvent.title}"
                </h3>
              </div>
              <button
                onClick={() => setChangeModalEvent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              The event is currently <strong>Approved</strong>. As the Club Lead, specify the modifications needed (e.g. venue timing, speaker adjustment, registration cap) so it can be updated and re-submitted to Admin.
            </p>

            <form onSubmit={handleConfirmLeadChanges} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Required Change Details & Notes:
                </label>
                <textarea
                  rows={4}
                  required
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="Specify what modifications are required..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-300">
                After saving, the event status will indicate <strong>Changes Requested</strong> with the button <strong>"Re-submit to Admin"</strong> available to send updated details for official approval.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setChangeModalEvent(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Submit Required Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
