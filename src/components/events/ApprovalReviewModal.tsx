import React, { useState } from 'react';
import { CampusEvent } from '../../types';
import { useApp } from '../../context/AppContext';
import { detectEventConflicts, formatFullDate, formatDisplayTime } from '../../utils/calendarUtils';
import {
  X,
  CheckCircle2,
  XCircle,
  MessageSquareWarning,
  AlertTriangle,
  Calendar,
  Clock,
  MapPin,
  Users,
  Building2,
  FileText,
  Edit3
} from 'lucide-react';

interface ApprovalReviewModalProps {
  event: CampusEvent;
  onClose: () => void;
}

export const ApprovalReviewModal: React.FC<ApprovalReviewModalProps> = ({ event, onClose }) => {
  const {
    approveEvent,
    rejectEvent,
    requestChanges,
    resubmitEventProposal,
    events,
    venues,
    currentUser
  } = useApp();

  const isAdmin = currentUser.role === 'college_admin';

  // Admin decision states
  const [changeComment, setChangeComment] = useState('');
  const [showChangeBox, setShowChangeBox] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);

  // Club Lead editable states for addressing changes requested
  const [editTitle, setEditTitle] = useState(event.title);
  const [editDate, setEditDate] = useState(event.date);
  const [editStartTime, setEditStartTime] = useState(event.startTime);
  const [editEndTime, setEditEndTime] = useState(event.endTime);
  const [editVenueId, setEditVenueId] = useState(event.venueId);
  const [editShortDesc, setEditShortDesc] = useState(event.shortDescription);
  const [editFullDesc, setEditFullDesc] = useState(event.fullDescription || '');
  const [editMaxParticipants, setEditMaxParticipants] = useState(event.maxParticipants || 100);
  const [editRegistrationLink, setEditRegistrationLink] = useState(event.registrationLink || '');

  const isChangesRequested = event.status === 'changes_requested';

  const conflict = detectEventConflicts(
    {
      id: event.id,
      date: !isAdmin && isChangesRequested ? editDate : event.date,
      startTime: !isAdmin && isChangesRequested ? editStartTime : event.startTime,
      endTime: !isAdmin && isChangesRequested ? editEndTime : event.endTime,
<<<<<<< HEAD
      venueId: !isAdmin && isChangesRequested ? editVenueId : event.venueId
=======
      venueId: !isAdmin && isChangesRequested ? editVenueId : event.venueId,
      venueName: !isAdmin && isChangesRequested ? venues.find((v) => v.id === editVenueId)?.name : event.venueName
>>>>>>> eff49e3 (First commit)
    },
    events
  );

  const handleApprove = () => {
    approveEvent(event.id);
    onClose();
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      alert('Please specify a rejection reason.');
      return;
    }
    rejectEvent(event.id, rejectReason);
    onClose();
  };

  const handleRequestChanges = () => {
    if (!changeComment.trim()) {
      alert('Please enter change instructions for the Club Lead.');
      return;
    }
    requestChanges(event.id, changeComment);
    onClose();
  };

  const handleResubmit = () => {
    if (!editTitle.trim()) {
      alert('Please provide an event title.');
      return;
    }
    if (!editDate) {
      alert('Please select a date for the event.');
      return;
    }
    if (editStartTime >= editEndTime) {
      alert('End time must be after start time.');
      return;
    }

    const selectedVenue = venues.find((v) => v.id === editVenueId);

    resubmitEventProposal(event.id, {
      title: editTitle.trim(),
      date: editDate,
      startTime: editStartTime,
      endTime: editEndTime,
      venueId: editVenueId,
      venueName: selectedVenue ? selectedVenue.name : event.venueName,
      shortDescription: editShortDesc.trim(),
      fullDescription: editFullDesc.trim(),
      maxParticipants: Number(editMaxParticipants),
      registrationLink: editRegistrationLink.trim() || undefined
    });

    alert(
      `Your changes for "${editTitle}" have been submitted for Admin's approval! You will be notified once the Admin reviews it.`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        
        {/* Header */}
        <div
          className={`p-5 sm:p-6 border-b flex items-center justify-between ${
            isAdmin
              ? 'bg-purple-500/10 dark:bg-purple-950/30 border-purple-200/80 dark:border-purple-900/60'
              : 'bg-amber-500/10 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-900/60'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`p-2 rounded-xl text-white shadow-sm ${
                isAdmin ? 'bg-purple-600' : 'bg-amber-500'
              }`}
            >
              {isAdmin ? (
                <MessageSquareWarning className="w-5 h-5" />
              ) : (
                <Calendar className="w-5 h-5" />
              )}
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
                {isAdmin
                  ? 'College Admin Approval Review Desk'
                  : 'Event Proposal Status & Review'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Submitted by{' '}
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {event.createdByName}
                </span>{' '}
                for {event.clubName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-8 space-y-6 max-h-[calc(85vh-14rem)] overflow-y-auto">
          
          {/* Status Banner for Club Lead */}
          {!isAdmin && event.status === 'pending_approval' && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <div className="font-extrabold text-amber-900 dark:text-amber-200">
                  Approval Request Sent to Admin
                </div>
                <div className="text-amber-800 dark:text-amber-300">
                  This event proposal has been submitted to the College Admin for verification. Once the Admin approves the proposal, it will automatically be displayed on the campus calendar.
                </div>
              </div>
            </div>
          )}

          {/* Changes Requested Banner & Action for Club Lead */}
          {!isAdmin && isChangesRequested && (
            <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-300 dark:border-orange-800 space-y-2">
              <div className="flex items-center gap-2 font-extrabold text-xs text-orange-900 dark:text-orange-200">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span>College Admin Requested Changes:</span>
              </div>
              <p className="text-xs text-orange-800 dark:text-orange-300 bg-white/70 dark:bg-slate-900/70 p-3 rounded-xl border border-orange-200 dark:border-orange-900 font-medium">
                "{event.changeComments?.[0] || 'Please review and adjust proposal details as required.'}"
              </p>
              <p className="text-[11px] text-orange-700 dark:text-orange-400">
                Update the proposal details below to address the Admin's feedback, then click{' '}
                <strong>"Resubmit for Admin's Approval"</strong> at the bottom.
              </p>
            </div>
          )}

          {/* Approved status banner */}
          {event.status === 'approved' && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <div className="font-extrabold text-emerald-900 dark:text-emerald-200">
                  Approved & Published to Calendar
                </div>
                <div className="text-emerald-800 dark:text-emerald-300">
                  This event was approved by the College Admin and is visible on the Campus Calendar.
                </div>
              </div>
            </div>
          )}

          {/* Rejected status banner */}
          {event.status === 'rejected' && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <div className="font-extrabold text-red-900 dark:text-red-200">
                  Proposal Rejected by Admin
                </div>
                <div className="text-red-800 dark:text-red-300">
                  {event.rejectionReason || 'No specific reason provided.'}
                </div>
              </div>
            </div>
          )}

          {/* Conflict Warning Box */}
          {conflict.hasConflict && (
<<<<<<< HEAD
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <div className="font-extrabold text-amber-900 dark:text-amber-200">
                  {conflict.type === 'venue' ? '⚠️ Venue Overlap Conflict' : '⚠️ Time Overlap Warning'}
                </div>
                <div className="text-amber-800 dark:text-amber-300">{conflict.message}</div>
=======
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <div className="font-extrabold text-rose-900 dark:text-rose-200">
                  ⚠️ Venue Conflict
                </div>
                <div className="text-rose-800 dark:text-rose-300 font-bold">{conflict.message}</div>
>>>>>>> eff49e3 (First commit)
                {isAdmin && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    As College Admin, you can "Request Changes" to ask the club lead to adjust the venue or time, or override and approve.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Previous Change Comments if any (for Admin view or history) */}
          {event.changeComments && event.changeComments.length > 0 && (isAdmin || !isChangesRequested) && (
            <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 space-y-2">
              <div className="font-bold text-xs text-orange-900 dark:text-orange-300">
                Review History & Admin Feedback:
              </div>
              <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1 pl-4 list-disc">
                {event.changeComments.map((comment, i) => (
                  <li key={i}>{comment}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Editable Form for Club Lead when Changes are Requested */}
          {!isAdmin && isChangesRequested ? (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2">
                <Edit3 className="w-4 h-4 text-indigo-500" />
                <span>Edit Proposal to Address Requested Changes</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      End Time *
                    </label>
                    <input
                      type="time"
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Venue *
                  </label>
                  <select
                    value={editVenueId}
                    onChange={(e) => setEditVenueId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                  >
                    {venues.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} (Cap: {v.capacity} • {v.building})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Short Description *
                  </label>
                  <input
                    type="text"
                    value={editShortDesc}
                    onChange={(e) => setEditShortDesc(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Description
                  </label>
                  <textarea
                    rows={3}
                    value={editFullDesc}
                    onChange={(e) => setEditFullDesc(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Max Capacity / Attendees
                    </label>
                    <input
                      type="number"
                      value={editMaxParticipants}
                      onChange={(e) => setEditMaxParticipants(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  {event.registrationType === 'link' && (
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Registration Link
                      </label>
                      <input
                        type="url"
                        value={editRegistrationLink}
                        onChange={(e) => setEditRegistrationLink(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Read-Only Event Preview Card */
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <img
                  src={event.posterUrl}
                  alt={event.title}
                  className="w-full sm:w-40 h-28 object-cover rounded-xl shadow-sm"
                />
                <div className="space-y-1 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                    {event.eventType}
                  </span>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                    {event.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {event.shortDescription}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>{formatFullDate(event.date)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 shrink-0">
                  <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>
                    {formatDisplayTime(event.startTime)} – {formatDisplayTime(event.endTime)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="font-medium whitespace-normal break-words">{event.venueName}</span>
                </div>
              </div>
            </div>
          )}

          {/* Extended description and details when in preview mode */}
          {(isAdmin || !isChangesRequested) && (
            <>
              <div className="space-y-1.5 text-xs">
                <div className="font-bold text-slate-900 dark:text-slate-100">Full Description:</div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl">
                  {event.fullDescription || 'No extended description provided.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Registration Mode:</span>
                  <div className="text-slate-600 dark:text-slate-400">
                    {event.registrationRequired
                      ? `Capacity: ${event.maxParticipants} students (${
                          event.registrationType === 'external' || event.registrationType === 'link'
                            ? 'Registration Link'
                            : event.registrationType === 'qr'
                            ? 'QR Code Registration'
                            : 'CampusConnect Ticket'
                        })`
                      : 'Open Entrance'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Eligibility:</span>
                  <div className="text-slate-600 dark:text-slate-400">{event.eligibility}</div>
                </div>
              </div>
            </>
          )}

          {/* Admin Request Changes Form Box */}
          {isAdmin && showChangeBox && (
            <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-300 dark:border-orange-800 space-y-3 animate-in fade-in">
              <div className="font-bold text-xs text-orange-900 dark:text-orange-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                Specify Required Changes for Club Lead:
              </div>
              <textarea
                rows={3}
                placeholder="e.g. Venue is already booked during this slot. Please change venue to Smart Classroom 301 or adjust time to afternoon..."
                value={changeComment}
                onChange={(e) => setChangeComment(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-orange-300 dark:border-orange-700 text-xs text-slate-900 dark:text-slate-100"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowChangeBox(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestChanges}
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Send Required Changes to Club Lead
                </button>
              </div>
            </div>
          )}

          {/* Admin Reject Reason Form Box */}
          {isAdmin && showRejectBox && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 space-y-3 animate-in fade-in">
              <div className="font-bold text-xs text-red-900 dark:text-red-200">
                Specify Reason for Rejection:
              </div>
              <input
                type="text"
                placeholder="e.g. Overlaps with compulsory End-Sem examinations."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-red-300 dark:border-red-700 text-xs text-slate-900 dark:text-slate-100"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowRejectBox(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        {isAdmin ? (
          /* College Admin Actions: Approve, Require Changes, Reject */
          <div className="p-5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <button
              onClick={() => {
                setShowRejectBox(true);
                setShowChangeBox(false);
              }}
              className="px-4 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject Proposal</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowChangeBox(true);
                  setShowRejectBox(false);
                }}
                className="px-4 py-2 text-xs font-bold text-orange-700 dark:text-orange-300 bg-orange-100/70 dark:bg-orange-950/50 hover:bg-orange-200/80 border border-orange-300/80 dark:border-orange-800 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Require Changes</span>
              </button>

              <button
                onClick={handleApprove}
                className="px-5 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve & Publish to Campus</span>
              </button>
            </div>
          </div>
        ) : isChangesRequested ? (
          /* Club Lead with Changes Requested: Re-submit to Admin */
          <div className="p-5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleResubmit}
              className="px-6 py-2.5 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Re-submit to Admin</span>
            </button>
          </div>
        ) : (
          /* Club Lead View only: Close button */
          <div className="p-5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
