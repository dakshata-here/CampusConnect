import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Club, CampusEvent } from '../../types';
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ArrowLeft,
  Search,
  Calendar,
  MapPin,
  Users,
  Sparkles,
  ChevronRight,
  Filter,
  Check,
  RotateCcw,
  MessageSquare,
  Eye,
  Send,
  X
} from 'lucide-react';
import { formatDisplayDate, formatDisplayTime } from '../../utils/calendarUtils';

export const ApprovalOverrideView: React.FC = () => {
  const {
    clubs,
    events,
    approveEvent,
    rejectEvent,
    requestChanges,
    setSelectedEventForModal
  } = useApp();

  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [clubSearch, setClubSearch] = useState('');
  const [clubCategoryFilter, setClubCategoryFilter] = useState('all');

  // Inside selected club
  const [eventStatusFilter, setEventStatusFilter] = useState('all');
  const [eventSearch, setEventSearch] = useState('');

  // Modals for actions
  const [targetEventForChanges, setTargetEventForChanges] = useState<CampusEvent | null>(null);
  const [changeComment, setChangeComment] = useState('');
  const [targetEventForReject, setTargetEventForReject] = useState<CampusEvent | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setActionSuccessToast(msg);
    setTimeout(() => setActionSuccessToast(null), 3500);
  };

  const selectedClub = clubs.find((c) => c.id === selectedClubId);

  // Filter clubs
  const filteredClubs = clubs.filter((club) => {
    if (clubSearch.trim()) {
      const q = clubSearch.toLowerCase();
      const match =
        club.name.toLowerCase().includes(q) ||
        club.shortName.toLowerCase().includes(q) ||
        club.department.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (clubCategoryFilter !== 'all' && club.category !== clubCategoryFilter) {
      return false;
    }
    return true;
  });

  // Events of selected club
  const clubEvents = events.filter((e) => e.clubId === selectedClubId);

  const filteredClubEvents = clubEvents.filter((event) => {
    if (eventSearch.trim()) {
      const q = eventSearch.toLowerCase();
      const match =
        event.title.toLowerCase().includes(q) ||
        event.shortDescription.toLowerCase().includes(q) ||
        event.venueName.toLowerCase().includes(q) ||
        event.eventType.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (eventStatusFilter !== 'all') {
      if (eventStatusFilter === 'pending' && event.status !== 'pending_approval') return false;
      if (eventStatusFilter === 'approved' && !['approved', 'published', 'registration_open'].includes(event.status)) return false;
      if (eventStatusFilter === 'changes' && event.status !== 'changes_requested') return false;
      if (eventStatusFilter === 'rejected' && event.status !== 'rejected') return false;
      if (eventStatusFilter === 'completed' && event.status !== 'completed') return false;
    }

    return true;
  });

  // Calculate stats for selected club
  const pendingCount = clubEvents.filter((e) => e.status === 'pending_approval').length;
  const approvedCount = clubEvents.filter((e) =>
    ['approved', 'published', 'registration_open', 'completed'].includes(e.status)
  ).length;
  const changesCount = clubEvents.filter((e) => e.status === 'changes_requested').length;
  const rejectedCount = clubEvents.filter((e) => e.status === 'rejected').length;

  const handleApprove = (eventId: string, title: string) => {
    approveEvent(eventId);
    showToast(`Approved "${title}"! Published to master calendar.`);
  };

  const handleConfirmChanges = () => {
    if (targetEventForChanges && changeComment.trim()) {
      requestChanges(targetEventForChanges.id, changeComment.trim());
      showToast(`Changes requested for "${targetEventForChanges.title}".`);
      setTargetEventForChanges(null);
      setChangeComment('');
    }
  };

  const handleConfirmReject = () => {
    if (targetEventForReject && rejectionReason.trim()) {
      rejectEvent(targetEventForReject.id, rejectionReason.trim());
      showToast(`Proposal "${targetEventForReject.title}" rejected.`);
      setTargetEventForReject(null);
      setRejectionReason('');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'published':
      case 'registration_open':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved
          </span>
        );
      case 'pending_approval':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-900 animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            Pending Review
          </span>
        );
      case 'changes_requested':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300 border border-orange-200 dark:border-orange-900">
            <AlertCircle className="w-3.5 h-3.5" />
            Changes Requested
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Completed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionSuccessToast && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{actionSuccessToast}</span>
        </div>
      )}

      {/* VIEW 1: ALL CLUBS LIST */}
      {!selectedClubId ? (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                <Building2 className="w-7 h-7 text-purple-600" />
                Approvals Override & Club Management
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Select a student club or technical society below to inspect, approve, or request revisions for all its events.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="dashboard-card p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Registered Clubs</span>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{clubs.length}</p>
            </div>
            <div className="dashboard-card p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Pending Proposals</span>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {events.filter((e) => e.status === 'pending_approval').length}
              </p>
            </div>
            <div className="dashboard-card p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Approved Events</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {events.filter((e) => ['approved', 'published', 'registration_open'].includes(e.status)).length}
              </p>
            </div>
            <div className="dashboard-card p-4 rounded-xl border border-orange-200 dark:border-orange-900/60 bg-orange-50/40 dark:bg-orange-950/20">
              <span className="text-[11px] font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider">Under Re-Submission</span>
              <p className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-1">
                {events.filter((e) => e.status === 'changes_requested').length}
              </p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search clubs by name, code, or department (e.g. IEEE, ACM, Robotics)..."
                value={clubSearch}
                onChange={(e) => setClubSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={clubCategoryFilter}
                onChange={(e) => setClubCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Categories</option>
                <option value="technical">Technical</option>
                <option value="cultural">Cultural</option>
                <option value="sports">Sports</option>
                <option value="social">Social</option>
              </select>
            </div>
          </div>

          {/* Clubs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClubs.map((club) => {
              const totalClubEvents = events.filter((e) => e.clubId === club.id);
              const pendingProposalCount = totalClubEvents.filter((e) => e.status === 'pending_approval').length;
              const approvedEventCount = totalClubEvents.filter((e) =>
                ['approved', 'published', 'registration_open', 'completed'].includes(e.status)
              ).length;

              return (
                <div
                  key={club.id}
                  id={`club-card-${club.id}`}
                  onClick={() => {
                    setSelectedClubId(club.id);
                    setEventStatusFilter('all');
                    setEventSearch('');
                  }}
                  className="dashboard-card rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-700/60 cursor-pointer transition-all group"
                >
                  <div className="space-y-3">
                    {/* Logo & Category */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0">
                        {club.logo ? (
                          <img
                            src={club.logo}
                            alt={club.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Building2 className="w-6 h-6 text-purple-600" />
                        )}
                      </div>

                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {club.category}
                      </span>
                    </div>

                    {/* Club Details */}
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {club.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {club.description}
                      </p>
                    </div>

                    {/* Lead info */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Lead / President:</span>
                        <strong className="text-slate-700 dark:text-slate-200">{club.presidentName}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Department:</span>
                        <span>{club.department}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Stats & Click prompt */}
                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {pendingProposalCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-500 text-white animate-pulse">
                          {pendingProposalCount} Pending
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">
                          {totalClubEvents.length} Total Events
                        </span>
                      )}
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                        {approvedEventCount} Approved
                      </span>
                    </div>

                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                      Inspect Events <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* VIEW 2: SELECTED CLUB AND ITS EVENTS */
        <div className="space-y-6">
          {/* Back button & Club Hero */}
          <div className="space-y-4">
            <button
              id="back-to-clubs-btn"
              onClick={() => setSelectedClubId(null)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All Clubs</span>
            </button>

            {selectedClub && (
              <div className="dashboard-card rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 shadow-sm">
                    {selectedClub.logo ? (
                      <img
                        src={selectedClub.logo}
                        alt={selectedClub.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <Building2 className="w-8 h-8 text-purple-600 m-auto" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                        {selectedClub.name}
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                        {selectedClub.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Lead: <strong>{selectedClub.presidentName}</strong> ({selectedClub.presidentEmail}) • {selectedClub.department}
                    </p>
                  </div>
                </div>

                {/* Quick counts for this club */}
                <div className="flex items-center gap-2 text-xs">
                  <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-center">
                    <span className="block font-black text-sm text-slate-900 dark:text-slate-100">{clubEvents.length}</span>
                    <span className="text-[10px] text-slate-500">Total</span>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-center">
                    <span className="block font-black text-sm text-amber-700 dark:text-amber-400">{pendingCount}</span>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400">Pending</span>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-center">
                    <span className="block font-black text-sm text-emerald-700 dark:text-emerald-400">{approvedCount}</span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400">Approved</span>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-900 text-center">
                    <span className="block font-black text-sm text-orange-700 dark:text-orange-400">{changesCount}</span>
                    <span className="text-[10px] text-orange-700 dark:text-orange-400">Revising</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Filter Tabs & Search for this Club's Events */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold overflow-x-auto w-full md:w-auto">
              {[
                { id: 'all', label: `All Events (${clubEvents.length})` },
                { id: 'pending', label: `Pending (${pendingCount})` },
                { id: 'approved', label: `Approved (${approvedCount})` },
                { id: 'changes', label: `Changes Requested (${changesCount})` },
                { id: 'rejected', label: `Rejected (${rejectedCount})` }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setEventStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                    eventStatusFilter === f.id
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Event Search */}
            <div className="relative w-full md:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search club events..."
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Cards of Events for this Club */}
          {filteredClubEvents.length === 0 ? (
            <div className="dashboard-card p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800">
              <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">No Events Found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                No events match the selected status filter for {selectedClub?.name}.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClubEvents.map((evt) => (
                <div
                  key={evt.id}
                  id={`override-event-${evt.id}`}
                  className="dashboard-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between hover:shadow-md transition-all"
                >
                  {/* Poster Header */}
                  <div className="relative h-40 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={evt.posterUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop&q=80'}
                      alt={evt.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    
                    {/* Status badge top right */}
                    <div className="absolute top-3 right-3">
                      {getStatusBadge(evt.status)}
                    </div>

                    {/* Event Type bottom left */}
                    <div className="absolute bottom-3 left-3">
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 shadow-xs">
                        {evt.eventType}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h3
                        onClick={() => setSelectedEventForModal(evt)}
                        className="font-bold text-base text-slate-900 dark:text-slate-100 hover:text-purple-600 cursor-pointer line-clamp-2"
                      >
                        {evt.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {evt.shortDescription}
                      </p>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span className="font-semibold">{formatDisplayDate(evt.date)}</span>
                          <span className="text-slate-400">•</span>
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formatDisplayTime(evt.startTime)} – {formatDisplayTime(evt.endTime)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="truncate">{evt.venueName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>Registrations: <strong>{evt.currentRegistrations}</strong> / {evt.maxParticipants}</span>
                        </div>
                      </div>

                      {/* Display Comments or Rejection details if any */}
                      {evt.changeComments && evt.changeComments.length > 0 && (
                        <div className="p-2 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900 rounded-xl text-[11px] text-orange-800 dark:text-orange-300">
                          <strong>Latest Remark:</strong> {evt.changeComments[0]}
                        </div>
                      )}
                      {evt.rejectionReason && (
                        <div className="p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-[11px] text-rose-800 dark:text-rose-300">
                          <strong>Rejection Note:</strong> {evt.rejectionReason}
                        </div>
                      )}
                    </div>

                    {/* Admin Override Action Buttons */}
                    <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center gap-2">
                        {/* Approve Button */}
                        {evt.status !== 'approved' && evt.status !== 'published' && evt.status !== 'registration_open' && (
                          <button
                            id={`approve-btn-${evt.id}`}
                            onClick={() => handleApprove(evt.id, evt.title)}
                            className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition-all"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve Event</span>
                          </button>
                        )}

                        {/* Request Changes */}
                        {evt.status !== 'completed' && (
                          <button
                            id={`request-changes-btn-${evt.id}`}
                            onClick={() => {
                              setTargetEventForChanges(evt);
                              setChangeComment('');
                            }}
                            className="py-1.5 px-3 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Revise</span>
                          </button>
                        )}

                        {/* Reject Proposal */}
                        {evt.status !== 'rejected' && evt.status !== 'completed' && (
                          <button
                            id={`reject-btn-${evt.id}`}
                            onClick={() => {
                              setTargetEventForReject(evt);
                              setRejectionReason('');
                            }}
                            className="py-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold flex items-center justify-center transition-colors"
                            title="Reject Proposal"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => setSelectedEventForModal(evt)}
                        className="w-full py-1 text-center text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                      >
                        View Full Event Details →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* REQUEST CHANGES MODAL */}
      {/* ========================================================================= */}
      {targetEventForChanges && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Request Changes on Event
                </h3>
              </div>
              <button onClick={() => setTargetEventForChanges(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Specify what modifications the club lead must make for <strong>"{targetEventForChanges.title}"</strong>:
            </p>

            <textarea
              rows={4}
              placeholder="e.g. Timing clashes with department practical exam. Please shift start time to 2:00 PM and adjust expected participant intake."
              value={changeComment}
              onChange={(e) => setChangeComment(e.target.value)}
              className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setTargetEventForChanges(null)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmChanges}
                disabled={!changeComment.trim()}
                className="px-4 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-xl shadow-xs"
              >
                Send Revision Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REJECT PROPOSAL MODAL */}
      {/* ========================================================================= */}
      {targetEventForReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Reject Event Proposal
                </h3>
              </div>
              <button onClick={() => setTargetEventForReject(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Please enter the official administrative reason for rejecting <strong>"{targetEventForReject.title}"</strong>:
            </p>

            <textarea
              rows={4}
              placeholder="e.g. Venue unavailable during institutional NAAC accreditation window. Proposal rejected for current semester."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setTargetEventForReject(null)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={!rejectionReason.trim()}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
