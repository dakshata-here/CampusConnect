import React from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  FileEdit,
  AlertTriangle,
  Building2,
  Calendar,
  Sparkles,
  ArrowRight,
  HelpCircle,
  FileText
} from 'lucide-react';
import { formatDisplayDate, formatDisplayTime } from '../../utils/calendarUtils';

export const SubheadDashboard: React.FC = () => {
  const {
    currentUser,
    events,
    setIsCreateEventOpen,
    setSelectedEventForModal,
    clubs
  } = useApp();

  const myClub = clubs.find((c) => c.id === currentUser.clubId) || clubs[0];
  const myProposals = events.filter((e) => e.createdBy === currentUser.id || e.clubId === myClub.id);

  const pendingCount = myProposals.filter((e) => e.status === 'pending_approval').length;
  const approvedCount = myProposals.filter((e) => ['approved', 'published', 'registration_open'].includes(e.status)).length;
  const changesCount = myProposals.filter((e) => e.status === 'changes_requested').length;

  return (
    <div className="space-y-8">
      
      {/* Subhead Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Subhead Workspace
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 text-[10px] font-bold border border-blue-100 dark:border-blue-900">
              {myClub.name}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            Welcome, {currentUser.name.split(' ')[0]} 🛠️
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Draft event proposals, check venue availability in real time, and submit for calendar publishing.
          </p>
        </div>

        <button
          onClick={() => setIsCreateEventOpen(true)}
          className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-center"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Submit New Proposal</span>
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl dashboard-card border">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Under Review</p>
          <div className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {pendingCount < 10 ? `0${pendingCount}` : pendingCount}
          </div>
        </div>

        <div className="p-4 rounded-xl dashboard-card border">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Approved & Live</p>
          <div className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {approvedCount < 10 ? `0${approvedCount}` : approvedCount}
          </div>
        </div>

        <div className="p-4 rounded-xl dashboard-card border">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Changes Requested</p>
          <div className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">
            {changesCount < 10 ? `0${changesCount}` : changesCount}
          </div>
        </div>
      </div>

      {/* Changes Requested Banner if any */}
      {changesCount > 0 && (
        <div className="p-4 rounded-xl dashboard-card border border-rose-200 dark:border-rose-900 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-xs text-rose-900 dark:text-rose-200">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Action Required: President Requested Changes on Your Proposals</span>
          </div>
          <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
            Please review the comments from your Club President regarding venue clashes or timing adjustments and resubmit.
          </p>
        </div>
      )}

      {/* Proposal History List */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Event Proposals & Pipeline
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track status of workshops, hackathons, and SIG sessions
          </p>
        </div>

        <div className="dashboard-card rounded-xl border overflow-hidden">
          <div className="divide-y divide-blue-100/70 dark:divide-slate-800">
            {myProposals.map((evt) => (
              <div
                key={evt.id}
                onClick={() => setSelectedEventForModal(evt)}
                className="p-4 hover:bg-sky-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                      {evt.eventType}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {evt.title}
                    </h3>
                  </div>
                  <StatusBadge status={evt.status} size="sm" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <div>📅 {formatDisplayDate(evt.date)}</div>
                  <div>⏰ {formatDisplayTime(evt.startTime)} – {formatDisplayTime(evt.endTime)}</div>
                  <div>📍 {evt.venueName}</div>
                </div>

                {evt.changeComments && evt.changeComments.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-900 dark:text-rose-200 space-y-0.5">
                    <span className="font-semibold">President Feedback:</span>
                    <div>"{evt.changeComments[evt.changeComments.length - 1]}"</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
