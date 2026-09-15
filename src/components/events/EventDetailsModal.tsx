import React, { useState } from 'react';
import { CampusEvent } from '../../types';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  Building2,
  Bell,
  Download,
  ExternalLink,
  Share2,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Sparkles,
  MessageSquare,
  Award,
  Phone,
  Mail,
  FileCheck,
  Edit3,
  Trash2
} from 'lucide-react';
import {
  formatFullDate,
  formatDisplayTime,
  calculateTimeRemaining,
  generateIcsFile,
  getGoogleCalendarUrl,
  getOutlookCalendarUrl
} from '../../utils/calendarUtils';

interface EventDetailsModalProps {
  event: CampusEvent;
  onClose: () => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ event, onClose }) => {
  const {
    currentUser,
    registrations,
    registerForEvent,
    cancelRegistration,
    reminders,
    setEventReminder,
    removeEventReminder,
    setSelectedEventForApproval,
    rescheduleEvent,
    cancelEvent,
    setIsFeedbackModalOpen,
    setFeedbackTargetEvent,
    venues,
    clubs
  } = useApp();

  const [teamName, setTeamName] = useState('');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [isRegistering, setIsRegistering] = useState(false);
  const [regError, setRegError] = useState('');
  const [showReminderMenu, setShowReminderMenu] = useState(false);
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);

  // Reschedule form state
  const [newDate, setNewDate] = useState(event.date);
  const [newStart, setNewStart] = useState(event.startTime);
  const [newEnd, setNewEnd] = useState(event.endTime);
  const [newVenueId, setNewVenueId] = useState(event.venueId);
  const [rescheduleReason, setRescheduleReason] = useState('');

  const userRegistration = registrations.find(
    (r) => r.eventId === event.id && r.studentId === currentUser.id
  );

  const isRegistered = !!userRegistration;
  const userReminder = reminders.find((r) => r.eventId === event.id && r.studentId === currentUser.id);

  const isOrganizer =
    currentUser.role === 'college_admin' ||
    (currentUser.role === 'president' && currentUser.clubId === event.clubId) ||
    currentUser.id === event.createdBy;

  const canReview =
    event.status === 'pending_approval' &&
    (currentUser.role === 'college_admin' || (currentUser.role === 'president' && currentUser.clubId === event.clubId));

  const timeRemaining = calculateTimeRemaining(event.date, event.startTime);
  const isPast = timeRemaining.isPast;

  const handleRegister = () => {
    setIsRegistering(true);
    setRegError('');
    const res = registerForEvent(event.id, teamName, phone);
    setIsRegistering(false);
    if (!res.success) {
      setRegError(res.message);
    }
  };

  const handleResubmitReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleReason.trim()) {
      alert('Please provide a reason for rescheduling.');
      return;
    }
    rescheduleEvent(event.id, newDate, newStart, newEnd, newVenueId, rescheduleReason);
    setShowRescheduleForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Poster Banner */}
        <div className="relative h-64 sm:h-72 w-full bg-slate-950">
          <img
            src={event.posterUrl}
            alt={event.title}
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Top category badges */}
          <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap">
            <span className="bg-indigo-600 text-white font-bold text-xs px-3 py-1 rounded-full shadow">
              {event.eventType}
            </span>
            <StatusBadge status={event.status} size="sm" />
          </div>

          {/* Banner bottom info */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center gap-2 text-xs text-indigo-300 font-semibold mb-1">
              {event.clubLogo ? (
                <img src={event.clubLogo} alt={event.clubName} className="w-4 h-4 rounded-full" />
              ) : (
                <Building2 className="w-4 h-4" />
              )}
              <span>{event.clubName || event.organizerName}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
              {event.title}
            </h1>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="p-5 sm:p-8 space-y-6 max-h-[calc(85vh-18rem)] overflow-y-auto">
          
          {/* Rescheduled Notice Banner if applicable */}
          {event.rescheduledHistory && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Notice: Event Schedule Updated</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Reason: {event.rescheduledHistory.reason}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-amber-200/60 dark:border-amber-800/40">
                <div>
                  <span className="text-slate-400">Previous:</span>{' '}
                  <span className="line-through">{event.rescheduledHistory.oldDate} ({event.rescheduledHistory.oldTime}) at {event.rescheduledHistory.oldVenue}</span>
                </div>
                <div>
                  <span className="text-slate-400">Rescheduled To:</span>{' '}
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{event.rescheduledHistory.newDate} ({event.rescheduledHistory.newTime}) at {event.rescheduledHistory.newVenue}</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Details Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-900 dark:text-slate-100">Date</div>
                <div className="text-slate-600 dark:text-slate-400">{formatFullDate(event.date)}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-900 dark:text-slate-100">Time</div>
                <div className="text-slate-600 dark:text-slate-400">
                  {formatDisplayTime(event.startTime)} – {formatDisplayTime(event.endTime)}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-900 dark:text-slate-100">Venue</div>
                <div className="text-slate-600 dark:text-slate-400">{event.venueName}</div>
              </div>
            </div>
          </div>

          {/* Calendar Sync & Reminders Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Sync to Calendar:
              </span>
              <a
                href={getGoogleCalendarUrl(event)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs"
              >
                Google Calendar
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
              <a
                href={getOutlookCalendarUrl(event)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs"
              >
                Outlook
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
              <button
                onClick={() => generateIcsFile(event)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs"
              >
                <Download className="w-3 h-3 text-indigo-600" />
                Download .ICS
              </button>
            </div>

            {/* Smart Reminder Dropdown */}
            <div className="relative">
              {userReminder ? (
                <button
                  onClick={() => removeEventReminder(userReminder.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-300 dark:border-amber-700 hover:bg-amber-200"
                >
                  <Bell className="w-3.5 h-3.5 fill-current" />
                  <span>Reminder set ({userReminder.reminderTimeText})</span>
                  <X className="w-3 h-3 ml-1" />
                </button>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setShowReminderMenu(!showReminderMenu)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Set Reminder</span>
                  </button>

                  {showReminderMenu && (
                    <div className="absolute right-0 top-full mt-1.5 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-30 animate-in fade-in">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Notify me before:
                      </div>
                      {[
                        { id: '1_day', label: '1 day before' },
                        { id: '6_hours', label: '6 hours before' },
                        { id: '1_hour', label: '1 hour before' },
                        { id: '30_mins', label: '30 minutes before' }
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setEventReminder(event.id, opt.id as any);
                            setShowReminderMenu(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          🔔 {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              About This Event
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {event.fullDescription || event.shortDescription}
            </p>
          </div>

          {/* Eligibility & Instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
              <div className="font-bold text-slate-900 dark:text-slate-100">🎯 Eligibility Criteria</div>
              <div className="text-slate-600 dark:text-slate-400 leading-relaxed">{event.eligibility}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
              <div className="font-bold text-slate-900 dark:text-slate-100">🎒 Required Materials & Instructions</div>
              <div className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {event.requiredMaterials || 'College ID Card and laptop.'}
                {event.instructions && <div className="mt-1 font-medium text-indigo-600 dark:text-indigo-400">{event.instructions}</div>}
              </div>
            </div>
          </div>

          {/* Contact Person */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Event Coordinator:</span>{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">{event.contactPerson}</span>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={`mailto:${event.contactEmail}`}
                className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <Mail className="w-3.5 h-3.5" />
                {event.contactEmail}
              </a>
              {event.contactNumber && (
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                  <Phone className="w-3.5 h-3.5" />
                  {event.contactNumber}
                </span>
              )}
            </div>
          </div>

          {/* Registration Box / QR Pass section */}
          {event.registrationRequired && (
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-blue-950/30 border border-indigo-200/80 dark:border-indigo-900/60 shadow-md space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                    Registration Desk
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {event.currentRegistrations} / {event.maxParticipants} Seats Occupied
                  </p>
                </div>

                {isRegistered && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-300 dark:border-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {userRegistration.attendanceStatus === 'attended' ? 'Attendance Verified ✅' : 'Pass Confirmed'}
                  </span>
                )}
              </div>

              {/* Already Registered State -> Show Ticket & QR Code */}
              {isRegistered ? (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* QR Code display */}
                    <div className="p-3 bg-white rounded-xl border border-slate-300 shadow-inner shrink-0 flex flex-col items-center">
                      <div className="w-28 h-28 bg-slate-900 p-2 rounded-lg flex items-center justify-center text-white font-mono text-[10px] text-center break-all">
                        {/* Realistic SVG QR Pattern */}
                        <div className="grid grid-cols-5 gap-1 w-full h-full p-1 bg-white">
                          <div className="bg-black rounded-xs"></div>
                          <div className="bg-black rounded-xs"></div>
                          <div className="bg-transparent"></div>
                          <div className="bg-black rounded-xs"></div>
                          <div className="bg-black rounded-xs"></div>
                          <div className="bg-black rounded-xs"></div>
                          <div className="bg-white border border-black"></div>
                          <div className="bg-black rounded-xs"></div>
                          <div className="bg-white border border-black"></div>
                          <div className="bg-black rounded-xs"></div>
                          <div className="bg-transparent"></div>
                          <div className="bg-black rounded-xs"></div>
                          <div className="bg-black rounded-xs"></div>
                          <div className="bg-transparent"></div>
                          <div className="bg-black rounded-xs"></div>
                          <div className="bg-black rounded-xs"></div>
                          <div className="bg-white border border-black"></div>
                          <div className="bg-black rounded-xs"></div>
                          <div className="bg-white border border-black"></div>
                          <div className="bg-black rounded-xs"></div>
                          <div className="bg-black rounded-xs"></div>
                          <div className="bg-black rounded-xs"></div>
                          <div className="bg-transparent"></div>
                          <div className="bg-black rounded-xs"></div>
                          <div className="bg-black rounded-xs"></div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 mt-1 font-bold">
                        {userRegistration.id}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 flex-1">
                      <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        Attendee: {userRegistration.studentName}
                      </div>
                      <div>
                        Roll No: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{userRegistration.studentEnrollment}</span>
                      </div>
                      {userRegistration.teamName && (
                        <div>
                          Team: <span className="font-semibold text-slate-800 dark:text-slate-200">{userRegistration.teamName}</span>
                        </div>
                      )}
                      <div>
                        Status:{' '}
                        <span className="font-bold text-emerald-600">
                          {userRegistration.attendanceStatus === 'attended' ? 'Attended (Certificate Ready)' : 'Seat Reserved (Show QR at Gate)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 pt-1">
                        Show this QR ticket at the registration desk when arriving at {event.venueName}.
                      </p>
                    </div>
                  </div>

                  {/* Feedback / Certificate CTA */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700 flex-wrap gap-2">
                    {event.status === 'completed' || userRegistration.attendanceStatus === 'attended' ? (
                      <button
                        onClick={() => {
                          setFeedbackTargetEvent(event);
                          setIsFeedbackModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{userRegistration.hasFeedbackGiven ? 'Update Feedback ⭐' : 'Give Event Feedback ⭐'}</span>
                      </button>
                    ) : (
                      <div className="text-[11px] text-slate-400">
                        Registration active. Attendance opens 30 mins before event.
                      </div>
                    )}

                    <button
                      onClick={() => cancelRegistration(userRegistration.id)}
                      className="text-xs text-rose-600 dark:text-rose-400 hover:underline"
                    >
                      Cancel my registration
                    </button>
                  </div>
                </div>
              ) : event.registrationType === 'external' || event.registrationType === 'link' ? (
                /* External Link Registration */
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    This event requires registration on an external platform or form. Click below to open the official registration link.
                  </p>
                  <a
                    href={event.registrationLink || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all"
                  >
                    <span>Open Registration Link</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ) : event.registrationType === 'qr' || event.registrationQrUrl ? (
                /* QR Code Registration */
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
                  <div className="flex items-center justify-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 text-xs">
                    <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Scan QR Code to Register</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Scan this official event registration QR code using Google Lens, Paytm, WhatsApp, or any QR scanner to complete your registration.
                  </p>
                  <div className="inline-block p-3 bg-white rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mx-auto">
                    <img
                      src={event.registrationQrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(event.title)}`}
                      alt="Registration QR Code"
                      className="w-44 h-44 object-contain rounded-lg"
                    />
                  </div>
                </div>
              ) : (
                /* Internal CampusConnect Registration Form */
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Team Name (Optional for Solo)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. CodeWizards"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Contact Phone Number
                      </label>
                      <input
                        type="text"
                        placeholder="+91 98000 00000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {regError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                      {regError}
                    </div>
                  )}

                  <button
                    onClick={handleRegister}
                    disabled={isRegistering || event.currentRegistrations >= event.maxParticipants}
                    className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm 1-Click Campus Registration</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Admin / President Management Controls */}
          {isOrganizer && (
            <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-indigo-500" />
                  Organizer & Admin Actions
                </span>

                <div className="flex items-center gap-2">
                  {canReview && (
                    <button
                      onClick={() => {
                        setSelectedEventForApproval(event);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors"
                    >
                      Review & Approve Proposal
                    </button>
                  )}

                  <button
                    onClick={() => setShowRescheduleForm(!showRescheduleForm)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 hover:bg-indigo-200 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-semibold text-xs transition-colors"
                  >
                    {showRescheduleForm ? 'Cancel Reschedule' : 'Reschedule Event'}
                  </button>

                  <button
                    onClick={() => {
                      const reason = prompt('Please enter cancellation reason for this event:');
                      if (reason) {
                        cancelEvent(event.id, reason);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 font-semibold text-xs transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Cancel Event
                  </button>
                </div>
              </div>

              {/* Reschedule Inline Form */}
              {showRescheduleForm && (
                <form onSubmit={handleResubmitReschedule} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 space-y-3 text-xs">
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    Reschedule Event Date / Venue (Will notify all registered students)
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">New Date</label>
                      <input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-300 dark:border-slate-700"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">New Venue</label>
                      <select
                        value={newVenueId}
                        onChange={(e) => setNewVenueId(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-300 dark:border-slate-700"
                      >
                        {venues.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name} (Cap: {v.capacity})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">New Start Time</label>
                      <input
                        type="time"
                        value={newStart}
                        onChange={(e) => setNewStart(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">New End Time</label>
                      <input
                        type="time"
                        value={newEnd}
                        onChange={(e) => setNewEnd(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">Reason for Rescheduling</label>
                    <input
                      type="text"
                      placeholder="e.g. Exam clash avoided, relocated to Main Auditorium for more capacity"
                      value={rescheduleReason}
                      onChange={(e) => setRescheduleReason(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-300 dark:border-slate-700"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowRescheduleForm(false)}
                      className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                    >
                      Broadcast Reschedule Update
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
