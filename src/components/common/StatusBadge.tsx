import React from 'react';
import { EventStatus } from '../../types';

interface StatusBadgeProps {
  status: EventStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3 py-1.5 font-semibold'
  };

  const config: Record<EventStatus, { label: string; bg: string; text: string; dot: string }> = {
    draft: {
      label: 'Draft',
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-700 dark:text-slate-300',
      dot: 'bg-slate-400'
    },
    pending_approval: {
      label: 'Pending Approval',
      bg: 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60',
      text: 'text-amber-800 dark:text-amber-300',
      dot: 'bg-amber-500 animate-pulse'
    },
    changes_requested: {
      label: 'Changes Requested',
      bg: 'bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60',
      text: 'text-orange-800 dark:text-orange-300',
      dot: 'bg-orange-500'
    },
    approved: {
      label: 'Approved',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60',
      text: 'text-emerald-800 dark:text-emerald-300',
      dot: 'bg-emerald-500'
    },
    published: {
      label: 'Published',
      bg: 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60',
      text: 'text-blue-800 dark:text-blue-300',
      dot: 'bg-blue-500'
    },
    registration_open: {
      label: 'Registration Open',
      bg: 'bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60',
      text: 'text-teal-800 dark:text-teal-300',
      dot: 'bg-teal-500'
    },
    registration_closed: {
      label: 'Registration Full',
      bg: 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60',
      text: 'text-rose-800 dark:text-rose-300',
      dot: 'bg-rose-500'
    },
    completed: {
      label: 'Completed',
      bg: 'bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700',
      text: 'text-slate-700 dark:text-slate-300',
      dot: 'bg-slate-400'
    },
    rejected: {
      label: 'Rejected',
      bg: 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60',
      text: 'text-red-800 dark:text-red-300',
      dot: 'bg-red-500'
    },
    cancelled: {
      label: 'Cancelled',
      bg: 'bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700',
      text: 'text-red-800 dark:text-red-200',
      dot: 'bg-red-600'
    },
    postponed: {
      label: 'Postponed / Rescheduled',
      bg: 'bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60',
      text: 'text-purple-800 dark:text-purple-300',
      dot: 'bg-purple-500'
    }
  };

  const current = config[status] || config.published;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${current.bg} ${current.text} ${sizeClasses[size]} transition-colors`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      <span>{current.label}</span>
    </span>
  );
};
