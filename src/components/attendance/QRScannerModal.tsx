import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  QrCode,
  Search,
  CheckCircle2,
  AlertCircle,
  Camera,
  Users,
  Award,
  Sparkles,
  Calendar,
  Building2
} from 'lucide-react';
import { formatDisplayDate } from '../../utils/calendarUtils';

interface QRScannerModalProps {
  onClose: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ onClose }) => {
  const {
    currentUser,
    events,
    registrations,
    markAttendanceByQrCode,
    clubs
  } = useApp();

  const [selectedEventId, setSelectedEventId] = useState<string>(
    events.find((e) => e.clubId === currentUser.clubId)?.id || events[0]?.id || ''
  );
  const [manualCode, setManualCode] = useState('');
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    studentName?: string;
    enrollment?: string;
    certificateId?: string;
  } | null>(null);

  const activeEvent = events.find((e) => e.id === selectedEventId);
  const eventRegistrations = registrations.filter((r) => r.eventId === selectedEventId);

  const handleScanSubmit = (qrString: string) => {
    const res = markAttendanceByQrCode(qrString);
    if (res.success && res.registration) {
      setScanResult({
        success: true,
        message: res.message,
        studentName: res.registration.studentName,
        enrollment: res.registration.studentEnrollment,
        certificateId: `CERT-${res.registration.id.toUpperCase()}`
      });
    } else {
      setScanResult({
        success: false,
        message: res.message
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-600 text-white shadow-sm">
              <QrCode className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
                Live Attendance Desk & QR Scanner
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scan attendee QR passes at the entrance to verify check-in and issue certificates.
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

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[calc(85vh-10rem)] overflow-y-auto">
          
          {/* Target Event Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Event for Check-In Desk:
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                setScanResult(null);
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
            >
              {events
                .filter((e) => currentUser.role === 'college_admin' || e.clubId === currentUser.clubId)
                .map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.title} ({formatDisplayDate(evt.date)} at {evt.venueName})
                  </option>
                ))}
            </select>
          </div>

          {/* Simulated Live Camera Scanner View */}
          <div className="relative rounded-2xl bg-slate-950 p-6 flex flex-col items-center justify-center text-white overflow-hidden border border-slate-800 shadow-inner">
            <div className="absolute top-3 left-3 flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono bg-slate-900/80 px-2 py-0.5 rounded border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              CAMERA FEED ACTIVE
            </div>

            {/* Scanning viewfinder overlay */}
            <div className="w-48 h-48 sm:w-56 sm:h-56 relative rounded-2xl border-2 border-dashed border-indigo-400/70 p-4 flex flex-col items-center justify-center my-4">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-indigo-500 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-indigo-500 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-indigo-500 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-indigo-500 rounded-br-lg" />

              {/* Animated laser scanline */}
              <div className="absolute left-2 right-2 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#06b6d4] animate-pulse" />

              <QrCode className="w-16 h-16 text-slate-600 animate-pulse" />
              <span className="text-[11px] text-slate-400 mt-2 text-center">
                Point student mobile QR ticket inside the frame
              </span>
            </div>

            {/* Quick manual QR code or Roll No input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (manualCode.trim()) {
                  handleScanSubmit(manualCode.trim());
                  setManualCode('');
                }
              }}
              className="w-full max-w-sm flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Or paste QR Token / Student Roll No..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="flex-1 bg-slate-900 text-white placeholder:text-slate-500 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Verify
              </button>
            </form>
          </div>

          {/* Verification Feedback Result Alert */}
          {scanResult && (
            <div
              className={`p-4 rounded-2xl border transition-all animate-in zoom-in-95 ${
                scanResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {scanResult.success ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0" />
                )}
                <div className="space-y-1 text-xs">
                  <div className="font-extrabold text-sm">
                    {scanResult.success ? '✅ Attendance Verified Successfully!' : '❌ Verification Error'}
                  </div>
                  <div>{scanResult.message}</div>
                  {scanResult.success && (
                    <div className="pt-2 flex items-center gap-2 flex-wrap text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                      <span>👤 {scanResult.studentName}</span>
                      <span>•</span>
                      <span>🆔 {scanResult.enrollment}</span>
                      <span>•</span>
                      <span className="bg-emerald-200/80 dark:bg-emerald-900 px-2 py-0.5 rounded text-emerald-900 dark:text-emerald-100">
                        🏆 Certificate Generated
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Registered Attendees Quick Scan List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Registered Attendees ({eventRegistrations.length})
              </h3>
              <span className="text-[11px] text-slate-400">
                Click "Simulate Scan" for instant 1-click check-in
              </span>
            </div>

            {eventRegistrations.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                No students registered for this event yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
                {eventRegistrations.map((reg) => (
                  <div
                    key={reg.id}
                    className="p-3 flex items-center justify-between gap-3 text-xs bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {reg.studentName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {reg.studentEnrollment} {reg.teamName && `• Team: ${reg.teamName}`}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {reg.attendanceStatus === 'attended' ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Checked-in
                        </span>
                      ) : (
                        <button
                          onClick={() => handleScanSubmit(reg.qrCodeString)}
                          className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Simulate Scan</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors"
          >
            Close Scanner
          </button>
        </div>

      </div>
    </div>
  );
};
