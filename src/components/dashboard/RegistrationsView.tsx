import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CampusEvent, Registration } from '../../types';
import {
  Users,
  Mail,
  Search,
  Download,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  Sparkles,
  Send,
  X,
  FileText,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';
import { formatDisplayDate, formatDisplayTime } from '../../utils/calendarUtils';

export const RegistrationsView: React.FC = () => {
  const {
    currentUser,
    events,
    registrations,
    clubs,
    sendEventBroadcastEmail,
    broadcastEmails
  } = useApp();

  const myClub = clubs.find((c) => c.id === currentUser.clubId) || clubs[0];
  const clubEvents = events.filter((e) => e.clubId === myClub.id);

  // Default to selecting the first event or 'Hello' hackathon if present
  const defaultSelected =
    clubEvents.find((e) => e.title.toLowerCase().includes('hello')) ||
    clubEvents[0] ||
    events[0];

  const [selectedEventId, setSelectedEventId] = useState<string>(
    defaultSelected ? defaultSelected.id : ''
  );
  const [studentSearch, setStudentSearch] = useState<string>('');

  // Email modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailBody, setEmailBody] = useState<string>('');
  const [emailCategory, setEmailCategory] = useState<string>('Reporting Guidelines');

  // Currently selected event
  const activeEvent =
    events.find((e) => e.id === selectedEventId) || defaultSelected;

  // Registered students for the selected event
  const eventRegistrations = registrations.filter(
    (r) => r.eventId === activeEvent?.id
  );

  // Filtered students by search
  const filteredStudents = eventRegistrations.filter(
    (r) =>
      r.studentName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      r.studentEmail.toLowerCase().includes(studentSearch.toLowerCase()) ||
      r.studentEnrollment.toLowerCase().includes(studentSearch.toLowerCase()) ||
      r.department.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // Sent emails for active event
  const eventBroadcastHistory = broadcastEmails.filter(
    (b) => b.eventId === activeEvent?.id
  );

  const openEmailModal = () => {
    if (!activeEvent) return;
    setEmailSubject(`[${myClub.shortName}] Important Update for "${activeEvent.title}"`);
    setEmailBody(
      `Dear Participant,\n\nWe are looking forward to hosting you for "${activeEvent.title}" on ${formatDisplayDate(
        activeEvent.date
      )} at ${activeEvent.venueName}.\n\nPlease ensure you bring your College ID card and arrive 15 minutes before ${formatDisplayTime(
        activeEvent.startTime
      )}.\n\nWarm regards,\n${myClub.name} Executive Committee`
    );
    setIsEmailModalOpen(true);
  };

  const handleApplyTemplate = (type: string) => {
    if (!activeEvent) return;
    if (type === 'reporting') {
      setEmailSubject(`[Action Required] Reporting Guidelines for "${activeEvent.title}"`);
      setEmailBody(
        `Dear Participant,\n\nPlease note the following reporting guidelines for ${activeEvent.title}:\n\n1. Reporting Time: ${formatDisplayTime(
          activeEvent.startTime
        )} sharp.\n2. Venue: ${activeEvent.venueName}\n3. Requirements: Carry your college ID card and personal laptop if hands-on.\n\nSee you there!\n— ${myClub.name}`
      );
    } else if (type === 'venue_update') {
      setEmailSubject(`[Notice] Venue Confirmation for "${activeEvent.title}"`);
      setEmailBody(
        `Dear Participant,\n\nThis is to confirm that "${activeEvent.title}" will be held at ${activeEvent.venueName}.\n\nDate: ${formatDisplayDate(
          activeEvent.date
        )}\nTiming: ${formatDisplayTime(activeEvent.startTime)} to ${formatDisplayTime(
          activeEvent.endTime
        )}\n\nLooking forward to your active participation!\n— ${myClub.name}`
      );
    } else if (type === 'resources') {
      setEmailSubject(`[Preparation] Software & Prerequisite Setup for "${activeEvent.title}"`);
      setEmailBody(
        `Dear Participant,\n\nTo make the most of the upcoming session, please complete the following prerequisite steps before arriving:\n\n• Ensure you have Git & Node.js installed\n• Charge your laptop fully\n• Join the WhatsApp / Discord communication group\n\nBest regards,\n${myClub.name}`
      );
    }
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvent || !emailSubject.trim() || !emailBody.trim()) return;

    sendEventBroadcastEmail({
      eventId: activeEvent.id,
      eventTitle: activeEvent.title,
      clubId: myClub.id,
      subject: emailSubject.trim(),
      message: emailBody.trim(),
      category: 'general',
      recipientCount: eventRegistrations.length,
      sentBy: currentUser.name
    });

    setIsEmailModalOpen(false);
  };

  const handleExportCSV = () => {
    if (!activeEvent || eventRegistrations.length === 0) return;

    const headers = ['Name,Email,Roll/PRN,Department,Year,Phone,RegistrationDate,Status'];
    const rows = eventRegistrations.map(
      (r) =>
        `"${r.studentName}","${r.studentEmail}","${r.studentEnrollment}","${r.department}","${r.year}","${r.phone}","${r.registrationDate}","${r.attendanceStatus}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeEvent.title.replace(/\s+/g, '_')}_Registrations.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-100/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800">
              {myClub.shortName} Attendee Registry
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Live Participant Database</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            Event Registrations & Participant Mailer
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Click on any event card below (e.g. <strong>"Hello"</strong> or <strong>"Happy Diwali"</strong>) to inspect registered students and dispatch broadcast emails.
          </p>
        </div>

        {activeEvent && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={eventRegistrations.length === 0}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold border border-blue-200 dark:border-slate-700 shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={openEmailModal}
              disabled={eventRegistrations.length === 0}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Mail className="w-4 h-4" />
              <span>Email Registered Students</span>
            </button>
          </div>
        )}
      </div>

      {/* ================= SECTION 1: SEPARATE CARDS FOR EACH EVENT ================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Select Event to View Registrations ({clubEvents.length} Events)</span>
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Click any card to load attendee list
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clubEvents.map((evt) => {
            const isSelected = evt.id === activeEvent?.id;
            const regCount = registrations.filter((r) => r.eventId === evt.id).length;
            const percent = Math.min(Math.round((regCount / (evt.maxParticipants || 100)) * 100), 100);

            return (
              <div
                key={evt.id}
                onClick={() => setSelectedEventId(evt.id)}
                className={`p-4 rounded-2xl cursor-pointer transition-all flex flex-col justify-between space-y-3 border ${
                  isSelected
                    ? 'ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 via-white to-sky-50 dark:from-slate-900 dark:via-blue-950/40 dark:to-slate-900 border-blue-400 dark:border-blue-600 shadow-md shadow-blue-500/10'
                    : 'dashboard-card hover:border-blue-300 dark:hover:border-blue-700 hover:scale-[1.01]'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {evt.eventType}
                    </span>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100/70 dark:bg-blue-950/80 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Selected
                      </span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                    {evt.title}
                  </h3>

                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>{formatDisplayDate(evt.date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">{evt.venueName}</span>
                    </div>
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div className="space-y-1.5 pt-2 border-t border-blue-100/60 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-blue-700 dark:text-blue-300">
                      {regCount} Students Registered
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Cap: {evt.maxParticipants}
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-blue-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= SECTION 2: REGISTERED STUDENTS DETAILS & EMAIL ================= */}
      {activeEvent ? (
        <div className="dashboard-card rounded-2xl border p-5 sm:p-6 space-y-5 shadow-xs">
          {/* Active Event Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-100/80 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  Active Card: {activeEvent.title}
                </span>
                <span className="text-xs text-slate-500">
                  {eventRegistrations.length} Total Attendees
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
                Registered Student Directory
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Detailed roster of students registered for <strong>{activeEvent.title}</strong>. Send updates or email reminders below.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={openEmailModal}
                disabled={eventRegistrations.length === 0}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Mail className="w-4 h-4" />
                <span>Send Email to {eventRegistrations.length} Students</span>
              </button>
            </div>
          </div>

          {/* Search bar & filter info */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by student name, roll no, email..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <span className="text-xs text-slate-500 dark:text-slate-400 self-start sm:self-auto">
              Showing {filteredStudents.length} of {eventRegistrations.length} students
            </span>
          </div>

          {/* Students Table */}
          {filteredStudents.length === 0 ? (
            <div className="text-center py-10 space-y-2 border rounded-xl border-dashed border-blue-200 dark:border-slate-800">
              <Users className="w-8 h-8 text-blue-400 mx-auto" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {eventRegistrations.length === 0
                  ? `No students have registered for "${activeEvent.title}" yet.`
                  : 'No students matched your search criteria.'}
              </p>
              <p className="text-[11px] text-slate-500">
                Registrations update in real time as students sign up via the campus portal.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-blue-100/80 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-blue-50/70 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-b border-blue-100 dark:border-slate-800 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Roll / PRN No.</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Department & Year</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Quick Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50 dark:divide-slate-800 bg-white/60 dark:bg-slate-900/60">
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {student.studentName}
                        </div>
                        {student.teamName && (
                          <span className="text-[10px] text-blue-600 dark:text-blue-400">
                            Team: {student.teamName}
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                        {student.studentEnrollment}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        {student.studentEmail}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        <div>{student.department}</div>
                        <div className="text-[10px] text-slate-400">{student.year}</div>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 font-mono">
                        {student.phone || '+91 98230 44102'}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" />
                          Confirmed
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <a
                          href={`mailto:${student.studentEmail}?subject=${encodeURIComponent(
                            `Update regarding ${activeEvent.title}`
                          )}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-300 text-[11px] font-semibold transition-colors"
                        >
                          <Mail className="w-3 h-3" />
                          <span>Mail</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Sent Broadcast Emails Log for this Event */}
          {eventBroadcastHistory.length > 0 && (
            <div className="pt-4 border-t border-blue-100/80 dark:border-slate-800 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-blue-600" />
                <span>Broadcast Emails Sent for This Event ({eventBroadcastHistory.length})</span>
              </h4>

              <div className="space-y-2">
                {eventBroadcastHistory.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-xl bg-blue-50/50 dark:bg-slate-800/50 border border-blue-100 dark:border-slate-700 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {b.subject}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(b.sentAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 line-clamp-2">
                      {b.message}
                    </p>
                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                      Delivered to {b.recipientCount} registered students by {b.sentBy}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center dashboard-card rounded-2xl border">
          <p className="text-xs text-slate-500">Select an event card above to view registered students.</p>
        </div>
      )}

      {/* ================= EMAIL BROADCAST MODAL ================= */}
      {isEmailModalOpen && activeEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-blue-900 shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                <div>
                  <h3 className="font-bold text-sm">Send Email to Registered Students</h3>
                  <p className="text-[11px] text-blue-100 truncate max-w-sm">
                    Event: {activeEvent.title} ({eventRegistrations.length} registered students)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSendEmail} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
              {/* Recipients Banner */}
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Recipient List: <strong>All {eventRegistrations.length} registered students</strong> of "{activeEvent.title}"
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase bg-blue-200/80 dark:bg-blue-900 px-2 py-0.5 rounded">
                  Broadcast
                </span>
              </div>

              {/* Template Quick Select */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Use Preset Message Template:
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('reporting')}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-slate-700"
                  >
                    📍 Reporting & Venue Guidelines
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('venue_update')}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-slate-700"
                  >
                    ⏰ Schedule / Venue Confirmation
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('resources')}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-slate-700"
                  >
                    💻 Preparation & Prerequisite Setup
                  </button>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Subject <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="e.g. Important instructions regarding Hackathon Check-in"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Message Body */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Message Body <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={6}
                  required
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Broadcast Email</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
