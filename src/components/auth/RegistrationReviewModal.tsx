import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Mail,
  Phone,
  Building2,
  GraduationCap,
  ShieldCheck,
  Calendar,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { UserRegistrationRequest } from '../../types';
import { useApp } from '../../context/AppContext';

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
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleAction = (status: 'pending' | 'approved' | 'rejected') => {
    updateRegistrationRequestStatus(request.id, status);
    setCurrentStatus(status);
    if (status === 'approved') {
      setFeedbackMessage(`Application approved! ${request.fullName} can now log in to the portal.`);
    } else if (status === 'rejected') {
      setFeedbackMessage(`Application rejected. Access has been denied.`);
    } else {
      setFeedbackMessage(`Application set to pending review.`);
    }

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const isClubLead = request.role === 'lead';
  const isAdmin = request.role === 'admin';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center border border-purple-200 dark:border-purple-800">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Review Registration Application
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Administrator verification for new institutional user access
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Feedback Banner if an action was just taken */}
          {feedbackMessage && (
            <div className="px-6 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
          )}

          {/* Modal Body / Displayed Information */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Top Applicant Banner */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                  {request.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {request.fullName}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      {isAdmin ? 'College Admin' : isClubLead ? 'Club Lead' : 'Student'}
                    </span>
                    {request.leadType && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {request.leadType === 'student' ? 'Student Coordinator' : 'Faculty Advisor'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-medium">Status:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    currentStatus === 'approved'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : currentStatus === 'rejected'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                  }`}
                >
                  {currentStatus}
                </span>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <Mail className="w-3.5 h-3.5 text-purple-500" />
                  <span>Email Address</span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 break-all">
                  {request.email}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <User className="w-3.5 h-3.5 text-purple-500" />
                  <span>{isAdmin ? 'Employee / Faculty ID' : 'PRN / Roll Number'}</span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {request.idNumber}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <Building2 className="w-3.5 h-3.5 text-purple-500" />
                  <span>Department</span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {request.department}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <GraduationCap className="w-3.5 h-3.5 text-purple-500" />
                  <span>{isAdmin ? 'Role / Cadre' : 'Year of Study'}</span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {request.year}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <Phone className="w-3.5 h-3.5 text-purple-500" />
                  <span>Contact Mobile Phone</span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {request.phone}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-purple-500" />
                  <span>Submitted On</span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {new Date(request.submittedAt).toLocaleDateString([], {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}{' '}
                  at{' '}
                  {new Date(request.submittedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>

            {/* Club Information if Club Lead */}
            {isClubLead && request.clubName && (
              <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wider">
                    Associated Student Club
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {request.clubName}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Approved Club Leads receive administrative privileges to manage club profile, create events, and verify student attendance.
                </p>
              </div>
            )}

            {/* Security Verification Q&A (for Admin Registration) */}
            {isAdmin && request.securityQuestions && request.securityQuestions.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    2-Step Verification Security Answers
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  {request.securityQuestions.map((qa, index) => (
                    <div
                      key={index}
                      className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                    >
                      <div className="font-semibold text-slate-600 dark:text-slate-400">
                        {index + 1}. {qa.question}
                      </div>
                      <div className="font-mono font-bold text-indigo-700 dark:text-indigo-300 mt-0.5">
                        Answer: {qa.answer}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer with Approve, Reject, Pending buttons at the bottom of the displayed information */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/70 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>

            {/* 3 Actions Requested by User: 'Approve', 'Reject', 'Pending' */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Pending button */}
              <button
                type="button"
                onClick={() => handleAction('pending')}
                disabled={currentStatus === 'pending'}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentStatus === 'pending'
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 opacity-60 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Pending</span>
              </button>

              {/* Reject button */}
              <button
                type="button"
                onClick={() => handleAction('rejected')}
                disabled={currentStatus === 'rejected'}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentStatus === 'rejected'
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700 opacity-60 cursor-not-allowed'
                    : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>

              {/* Approve button */}
              <button
                type="button"
                onClick={() => handleAction('approved')}
                disabled={currentStatus === 'approved'}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentStatus === 'approved'
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 opacity-60 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
