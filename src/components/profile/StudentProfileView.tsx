import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  User,
  Award,
  BookmarkCheck,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  FileCheck,
  Download,
  Printer,
  QrCode,
  Ticket,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { formatDisplayDate, formatDisplayTime } from '../../utils/calendarUtils';

export const StudentProfileView: React.FC = () => {
  const {
    currentUser,
    events,
    registrations,
    certificates,
    setSelectedEventForModal,
    setSelectedCertificate
  } = useApp();

  const [activeTab, setActiveTab] = useState<'registered' | 'attended' | 'certificates'>('registered');

  const userRegs = registrations.filter((r) => r.studentId === currentUser.id);
  const registeredEvents = userRegs
    .map((r) => ({ reg: r, event: events.find((e) => e.id === r.eventId) }))
    .filter((item): item is { reg: typeof userRegs[0]; event: typeof events[0] } => !!item.event);

  const upcomingPasses = registeredEvents.filter((item) => item.reg.attendanceStatus === 'registered');
  const attendedPasses = registeredEvents.filter((item) => item.reg.attendanceStatus === 'attended');
  const userCerts = certificates.filter((c) => c.studentId === currentUser.id);

  return (
    <div className="space-y-8">
      
      {/* Profile Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-20 h-20 rounded-2xl object-cover ring-4 ring-indigo-500/20 shadow-md"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                {currentUser.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase">
                {currentUser.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {currentUser.department} • {currentUser.year}
            </p>
            {currentUser.enrollmentNumber && (
              <div className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                Roll No: {currentUser.enrollmentNumber}
              </div>
            )}
          </div>
        </div>

        {/* Profile Stats */}
        <div className="flex items-center gap-4 self-stretch sm:self-auto justify-around sm:justify-end border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100 dark:border-slate-800">
          <div className="text-center">
            <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {userRegs.length}
            </div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Registered</div>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
          <div className="text-center">
            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {attendedPasses.length}
            </div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Attended</div>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
          <div className="text-center">
            <div className="text-xl font-extrabold text-amber-500">
              {userCerts.length}
            </div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Certificates</div>
          </div>
        </div>
      </div>

      {/* Profile Section Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('registered')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'registered'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Active Passes ({upcomingPasses.length})
        </button>

        <button
          onClick={() => setActiveTab('attended')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'attended'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Attendance History ({attendedPasses.length})
        </button>

        <button
          onClick={() => setActiveTab('certificates')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'certificates'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Verifiable Certificates ({userCerts.length})
        </button>
      </div>

      {/* Active Passes Tab */}
      {activeTab === 'registered' && (
        <div className="space-y-4">
          {upcomingPasses.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
              <BookmarkCheck className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">No Active Registered Passes</h3>
              <p className="text-xs text-slate-400">Explore events and register to receive your official entry pass.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingPasses.map(({ reg, event }) => (
                <div
                  key={reg.id}
                  onClick={() => setSelectedEventForModal(event)}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-400 transition-all cursor-pointer flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full">
                        {event.eventType}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        Pass: {reg.id}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                      {event.title}
                    </h3>

                    <div className="text-xs text-slate-500 space-y-1">
                      <div>📅 {formatDisplayDate(event.date)} at {formatDisplayTime(event.startTime)}</div>
                      <div>📍 {event.venueName}</div>
                      {reg.teamName && <div>👥 Team: <strong>{reg.teamName}</strong></div>}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      <Ticket className="w-4 h-4" />
                      View Official Entry Pass
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Attended History Tab */}
      {activeTab === 'attended' && (
        <div className="space-y-4">
          {attendedPasses.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">No Attended Events Recorded</h3>
              <p className="text-xs text-slate-400">Your verified attendance records and completion certificates will be displayed here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              {attendedPasses.map(({ reg, event }) => (
                <div
                  key={reg.id}
                  onClick={() => setSelectedEventForModal(event)}
                  className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                >
                  <div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                      Attendance Verified ✓
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1">
                      {event.title}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {event.clubName} • {formatDisplayDate(event.date)}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const cert = certificates.find((c) => c.studentId === currentUser.id && c.eventTitle === event.title);
                      if (cert) setSelectedCertificate(cert);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs"
                  >
                    View Certificate 🏆
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Certificates Tab */}
      {activeTab === 'certificates' && (
        <div className="space-y-4">
          {userCerts.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
              <Award className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">No Certificates Earned Yet</h3>
              <p className="text-xs text-slate-400">Participate in workshops, hackathons, and SIG sessions to earn verified credentials.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {userCerts.map((cert) => (
                <div
                  key={cert.id}
                  onClick={() => setSelectedCertificate(cert)}
                  className="p-5 rounded-3xl bg-gradient-to-br from-amber-50/60 to-white dark:from-slate-900 dark:to-slate-800 border border-amber-200/80 dark:border-amber-900/40 shadow-xs hover:shadow-md cursor-pointer transition-all space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <Award className="w-8 h-8 text-amber-500" />
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {cert.certificateNumber}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                      {cert.eventTitle}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Issued by {cert.clubName} on {formatDisplayDate(cert.issueDate)}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    <span>View & Print Official Certificate</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
