import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CampusEvent } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileEdit,
  Send,
  Calendar,
  MapPin,
  Users,
  Building2,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Check,
  X
} from 'lucide-react';
<<<<<<< HEAD
import { formatDisplayDate, formatDisplayTime } from '../../utils/calendarUtils';
=======
import { formatDisplayDate, formatDisplayTime, detectEventConflicts } from '../../utils/calendarUtils';
>>>>>>> eff49e3 (First commit)

export const SubmittedProposalsView: React.FC = () => {
  const {
    currentUser,
    events,
    clubs,
    venues,
    leadRequestChangesOnApproved,
    resubmitEventProposal,
    setSelectedEventForModal,
    setSelectedEventForApproval,
    setIsCreateEventOpen
  } = useApp();

  const myClub = clubs.find((c) => c.id === currentUser.clubId) || clubs[0];
  const clubProposals = events.filter((e) => e.clubId === myClub.id);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal / drawer for Club Lead "Required Changes"
  const [editingEvent, setEditingEvent] = useState<CampusEvent | null>(null);
  const [changeReason, setChangeReason] = useState<string>('');
  const [editTitle, setEditTitle] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');
  const [editStartTime, setEditStartTime] = useState<string>('');
  const [editEndTime, setEditEndTime] = useState<string>('');
  const [editVenueId, setEditVenueId] = useState<string>('');
  const [editShortDesc, setEditShortDesc] = useState<string>('');
  const [editMaxParticipants, setEditMaxParticipants] = useState<number>(100);

  const openRequiredChangesModal = (event: CampusEvent) => {
    setEditingEvent(event);
    setChangeReason(
      event.status === 'approved'
        ? 'Schedule or venue update needed after initial approval'
        : event.changeComments?.[0] || ''
    );
    setEditTitle(event.title);
    setEditDate(event.date);
    setEditStartTime(event.startTime);
    setEditEndTime(event.endTime);
    setEditVenueId(event.venueId);
    setEditShortDesc(event.shortDescription);
    setEditMaxParticipants(event.maxParticipants || 100);
  };

<<<<<<< HEAD
=======
  const editConflict = editingEvent
    ? detectEventConflicts(
        {
          id: editingEvent.id,
          date: editDate,
          startTime: editStartTime,
          endTime: editEndTime,
          venueId: editVenueId,
          venueName: venues.find((v) => v.id === editVenueId)?.name
        },
        events
      )
    : { hasConflict: false };

>>>>>>> eff49e3 (First commit)
  const handleSaveRequiredChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    if (!changeReason.trim()) {
      alert('Please specify the reason for the required changes.');
      return;
    }

<<<<<<< HEAD
=======
    if (editConflict.hasConflict && editConflict.type === 'venue') {
      alert(editConflict.message);
      return;
    }

>>>>>>> eff49e3 (First commit)
    const selectedVenue = venues.find((v) => v.id === editVenueId);

    const updates: Partial<CampusEvent> = {
      title: editTitle,
      date: editDate,
      startTime: editStartTime,
      endTime: editEndTime,
      venueId: editVenueId,
      venueName: selectedVenue?.name || editingEvent.venueName,
      shortDescription: editShortDesc,
      maxParticipants: editMaxParticipants
    };

    leadRequestChangesOnApproved(editingEvent.id, changeReason.trim(), updates);
    setEditingEvent(null);
  };

  const handleDirectResubmit = (event: CampusEvent) => {
    resubmitEventProposal(event.id, {
      status: 'pending_approval'
    });
  };

  // Filtered proposals
  const filteredProposals = clubProposals.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.eventType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.venueName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'all') return true;
    if (filterStatus === 'approved') return p.status === 'approved' || p.status === 'published';
    if (filterStatus === 'pending') return p.status === 'pending_approval';
    if (filterStatus === 'changes_requested') return p.status === 'changes_requested';
    if (filterStatus === 'rejected') return p.status === 'rejected';

    return true;
  });

  const counts = {
    all: clubProposals.length,
    approved: clubProposals.filter((p) => ['approved', 'published'].includes(p.status)).length,
    pending: clubProposals.filter((p) => p.status === 'pending_approval').length,
    changes: clubProposals.filter((p) => p.status === 'changes_requested').length,
    rejected: clubProposals.filter((p) => p.status === 'rejected').length
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-100/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800">
              {myClub.shortName} Club Administration
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Official Portal</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            Submitted Proposals & Approval Lifecycle
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Track all event proposals submitted to the College Admin with complete review workflows, status feedback, and revision cycles.
          </p>
        </div>

        <button
          onClick={() => setIsCreateEventOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center gap-2 self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Submit New Proposal</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search proposals by title, type, venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-blue-50/60 dark:bg-slate-900/60 rounded-xl border border-blue-100 dark:border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              filterStatus === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
            }`}
          >
            All ({counts.all})
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              filterStatus === 'approved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
            }`}
          >
            Approved ({counts.approved})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              filterStatus === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-amber-500'
            }`}
          >
            Pending ({counts.pending})
          </button>
          <button
            onClick={() => setFilterStatus('changes_requested')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              filterStatus === 'changes_requested'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-orange-600'
            }`}
          >
            Changes Requested ({counts.changes})
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              filterStatus === 'rejected'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
            }`}
          >
            Rejected ({counts.rejected})
          </button>
        </div>
      </div>

      {/* Proposals Grid */}
      {filteredProposals.length === 0 ? (
        <div className="p-12 text-center dashboard-card rounded-2xl border space-y-3">
          <Clock className="w-10 h-10 text-blue-400 mx-auto" />
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
            No Event Proposals Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {filterStatus === 'all'
              ? 'Your club has not submitted any event proposals yet. Click "Submit New Proposal" to get started.'
              : `No event proposals match the status "${filterStatus}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredProposals.map((evt) => {
            const isApproved = evt.status === 'approved' || evt.status === 'published';
            const isPending = evt.status === 'pending_approval';
            const isChangesRequested = evt.status === 'changes_requested';
            const isRejected = evt.status === 'rejected';

            return (
              <div
                key={evt.id}
                className={`p-5 rounded-2xl dashboard-card border transition-all flex flex-col justify-between space-y-4 ${
                  isChangesRequested
                    ? 'ring-2 ring-orange-400/40 dark:ring-orange-500/30'
                    : isApproved
                    ? 'ring-1 ring-emerald-400/30'
                    : ''
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Event Type & Status Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-blue-100/80 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {evt.eventType}
                    </span>
                    <StatusBadge status={evt.status} size="sm" />
                  </div>

                  {/* Title & Short Desc */}
                  <div>
                    <h3
                      onClick={() => setSelectedEventForModal(evt)}
                      className="font-bold text-base text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                    >
                      {evt.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                      {evt.shortDescription}
                    </p>
                  </div>

                  {/* Date, Time, Venue metadata */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-3 border-t border-blue-100/60 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      <span>{formatDisplayDate(evt.date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>{formatDisplayTime(evt.startTime)} - {formatDisplayTime(evt.endTime)}</span>
                    </div>
                    <div className="col-span-2 flex items-center gap-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">{evt.venueName}</span>
                    </div>
                    <div className="col-span-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      <span>Submitted by: <strong className="text-slate-700 dark:text-slate-300">{evt.createdByName}</strong></span>
                      <span>Cap: {evt.maxParticipants}</span>
                    </div>
                  </div>

                  {/* Status Banner Notes */}
                  {isChangesRequested && (
                    <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-300 dark:border-orange-800/80 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-orange-900 dark:text-orange-200">
                        <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0" />
                        <span>Required Changes Feedback:</span>
                      </div>
                      <p className="text-xs italic text-orange-800 dark:text-orange-300 bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg border border-orange-200 dark:border-orange-900">
                        "{evt.changeComments?.[0] || 'Admin requested adjustments. Please modify and resubmit.'}"
                      </p>
                      <p className="text-[10px] text-orange-700 dark:text-orange-400">
                        Modify event parameters and click <strong>"Re-submit to Admin"</strong> below.
                      </p>
                    </div>
                  )}

                  {isPending && (
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
                      <span>Submitted to College Admin for verification. Awaiting Admin decision.</span>
                    </div>
                  )}

                  {isApproved && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Approved & Published by College Admin</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                        Active on Campus
                      </span>
                    </div>
                  )}

                  {isRejected && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 space-y-1 text-xs text-rose-900 dark:text-rose-200">
                      <div className="flex items-center gap-1.5 font-bold">
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Rejected by College Admin:</span>
                      </div>
                      <p className="italic text-rose-800 dark:text-rose-300">
                        "{evt.rejectionReason || 'Proposal did not meet college guidelines.'}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-blue-100/60 dark:border-slate-800 flex items-center gap-2 flex-wrap">
                  {/* Case 1: Approved Event -> Club Lead wants changes: Button "Required Changes" */}
                  {isApproved && (
                    <button
                      onClick={() => openRequiredChangesModal(evt)}
                      className="flex-1 py-2 px-3 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>Required Changes</span>
                    </button>
                  )}

                  {/* Case 2: Changes Requested Event -> Button "Required Changes" to edit AND "Re-submit to Admin" */}
                  {isChangesRequested && (
                    <>
                      <button
                        onClick={() => openRequiredChangesModal(evt)}
                        className="py-2 px-3 rounded-xl font-bold text-xs bg-orange-100 hover:bg-orange-200 dark:bg-orange-950/60 dark:hover:bg-orange-900 text-orange-800 dark:text-orange-200 border border-orange-300 dark:border-orange-800 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <FileEdit className="w-3.5 h-3.5" />
                        <span>Edit Changes</span>
                      </button>

                      <button
                        onClick={() => handleDirectResubmit(evt)}
                        className="flex-1 py-2 px-3 rounded-xl font-extrabold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Re-submit to Admin</span>
                      </button>
                    </>
                  )}

                  {/* View Details Button */}
                  <button
                    onClick={() => setSelectedEventForModal(evt)}
                    className="py-2 px-3 rounded-xl font-semibold text-xs bg-blue-50/80 hover:bg-blue-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-slate-700 transition-colors"
                  >
                    Details
                  </button>

                  {/* If user is also testing as College Admin, show Admin Review shortcut */}
                  {currentUser.role === 'college_admin' && (
                    <button
                      onClick={() => setSelectedEventForApproval(evt)}
                      className="py-2 px-3 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-colors"
                    >
                      Admin Review
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Club Lead "Required Changes" Form */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-blue-900 shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileEdit className="w-5 h-5" />
                <h3 className="font-bold text-sm">Required Changes for Event Proposal</h3>
              </div>
              <button
                onClick={() => setEditingEvent(null)}
                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRequiredChanges} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200">
                You are updating proposal details for <strong>"{editingEvent.title}"</strong>. After saving, you will be able to click <strong>"Re-submit to Admin"</strong> to send the changes for Admin approval.
              </div>

              {/* Modification Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Required Changes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Explain why changes are needed (e.g., Guest speaker rescheduled, room capacity adjusted, practical clash avoided)..."
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Event Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Date & Times */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Venue */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Selected Venue
                </label>
                <select
                  value={editVenueId}
                  onChange={(e) => setEditVenueId(e.target.value)}
<<<<<<< HEAD
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
=======
                  className={`w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-900 dark:text-slate-100 ${
                    editConflict.hasConflict && editConflict.type === 'venue'
                      ? 'border-rose-500 ring-2 ring-rose-400/30'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
>>>>>>> eff49e3 (First commit)
                >
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} (Capacity: {v.capacity})
                    </option>
                  ))}
                </select>
<<<<<<< HEAD
=======

                {editConflict.hasConflict && editConflict.type === 'venue' && (
                  <div
                    role="alert"
                    className="mt-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2 animate-in fade-in"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>{editConflict.message}</span>
                  </div>
                )}
>>>>>>> eff49e3 (First commit)
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  value={editShortDesc}
                  onChange={(e) => setEditShortDesc(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Max Participant Capacity
                </label>
                <input
                  type="number"
                  min={10}
                  max={500}
                  value={editMaxParticipants}
                  onChange={(e) => setEditMaxParticipants(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Changes & Prepare Resubmission</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
