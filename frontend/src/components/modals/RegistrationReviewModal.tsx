import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRegistrationRequest } from '../../types';
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  User,
  Mail,
  Phone,
  Hash,
  Building2,
  GraduationCap,
  Briefcase,
  AlertCircle
} from 'lucide-react';

interface RegistrationReviewModalProps {
  request: UserRegistrationRequest;
  onClose: () => void;
}

export const RegistrationReviewModal: React.FC<RegistrationReviewModalProps> = ({
  request,
  onClose
}) => {
  const { updateRegistrationRequestStatus } = useApp();
  const [currentStatus, setCurrentStatus] = useState<'pending' | 'approved' | 'rejected'>(
    request.status
  );
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleStatusChange = (newStatus: 'pending' | 'approved' | 'rejected') => {
    updateRegistrationRequestStatus(request.id, newStatus);
    setCurrentStatus(newStatus);
    const labelMap = {
      approved: 'Approved',
      rejected: 'Rejected',
      pending: 'Set to Pending'
    };
    setFeedbackMsg(`Application successfully updated: ${labelMap[newStatus]}`);
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 3000);
  };

  const isFaculty = request.role === 'admin' || request.leadType === 'faculty';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-purple-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-200">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg tracking-tight">
                  Registration Request Review
                </h3>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    currentStatus === 'approved'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : currentStatus === 'rejected'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {currentStatus}
                </span>
              </div>
              <p className="text-xs text-purple-200/80">
                Institutional Authority Review Panel
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-purple-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert if Status changed */}
        {feedbackMsg && (
          <div className="p-3 mx-5 mt-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Applicant Information Display */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          
          {/* Main User Card */}
          <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/40 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  {request.role === 'admin' ? 'Institutional Administrator Application' : 'Club Lead Application'}
                </span>
                <h4 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                  {request.fullName}
                </h4>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold text-xs shadow-2xs">
                {request.role === 'admin' ? 'Admin Role' : 'Club Lead'}
              </span>
            </div>

            {/* Club Lead specific details */}
            {request.role === 'lead' && (
              <div className="pt-2 border-t border-purple-200/60 dark:border-purple-900/40 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Coordinator Type:</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
                    {request.leadType === 'faculty' ? (
                      <>
                        <Briefcase className="w-3.5 h-3.5 text-purple-500" />
                        <span>Faculty Coordinator</span>
                      </>
                    ) : (
                      <>
                        <GraduationCap className="w-3.5 h-3.5 text-purple-500" />
                        <span>Student Coordinator</span>
                      </>
                    )}
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Selected Club:</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-purple-500" />
                    <span>{request.clubName || 'Not Assigned'}</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* PRN or Employee ID */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                <span>{isFaculty ? 'Employee ID' : 'Student PRN'}</span>
              </span>
              <p className="font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
                {request.idNumber}
              </p>
            </div>

            {/* Email Address */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email Address</span>
              </span>
              <p className="font-bold text-slate-900 dark:text-slate-100 mt-1 truncate">
                {request.email}
              </p>
            </div>

            {/* Mobile Number */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Mobile Number</span>
              </span>
              <p className="font-bold text-slate-900 dark:text-slate-100 mt-1">
                {request.phone || 'Not Provided'}
              </p>
            </div>

            {/* Department */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Department</span>
              </span>
              <p className="font-bold text-slate-900 dark:text-slate-100 mt-1">
                {request.department || (request.role === 'admin' ? 'Institutional Administration' : 'PICT')}
              </p>
            </div>

            {/* Year of Study (if student) */}
            {!isFaculty && request.year && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 sm:col-span-2">
                <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                  <span>Year of Study</span>
                </span>
                <p className="font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {request.year}
                </p>
              </div>
            )}
          </div>

          {/* Security Questions (for Admin application) */}
          {request.role === 'admin' && request.securityQuestions && request.securityQuestions.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                <span>Configured 5 Security Verification Answers</span>
              </span>
              <div className="space-y-2 text-xs">
                {request.securityQuestions.map((sq, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
                      Q{idx + 1}: {sq.question}
                    </p>
                    <p className="text-slate-900 dark:text-slate-100 font-bold mt-0.5">
                      Answer: {sq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submission Timestamp */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
            <span>Submitted: {new Date(request.submittedAt).toLocaleString()}</span>
            <span>Request ID: {request.id}</span>
          </div>

          {/* Action Buttons: APPROVE, REJECT, PENDING at the bottom */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Admin Decision Actions:
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {/* Approve Button */}
              <button
                type="button"
                onClick={() => handleStatusChange('approved')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                  currentStatus === 'approved'
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900'
                    : 'bg-emerald-600/90 hover:bg-emerald-600 text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve</span>
              </button>

              {/* Reject Button */}
              <button
                type="button"
                onClick={() => handleStatusChange('rejected')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                  currentStatus === 'rejected'
                    ? 'bg-rose-600 text-white ring-2 ring-rose-500 ring-offset-2 dark:ring-offset-slate-900'
                    : 'bg-rose-600/90 hover:bg-rose-600 text-white'
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>

              {/* Pending Button */}
              <button
                type="button"
                onClick={() => handleStatusChange('pending')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                  currentStatus === 'pending'
                    ? 'bg-amber-600 text-white ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-slate-900'
                    : 'bg-amber-600/90 hover:bg-amber-600 text-white'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Pending</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
