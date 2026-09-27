import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  User,
  Shield,
  Sparkles,
  Lock,
  Mail,
  GraduationCap,
  Building2,
  CheckCircle2
} from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { allUsers, switchUser, setActiveTab } = useApp();
  const [selectedRoleTab, setSelectedRoleTab] = useState<'student' | 'president' | 'subhead' | 'admin'>('student');

  const handleSelectUser = (userId: string) => {
    switchUser(userId);
    setActiveTab('dashboard');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        
        {/* Header */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                CampusConnect Portal Login
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sign in or switch test account credentials
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click Quick Demo Switch */}
        <div className="p-6 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Select Demo Persona:
          </div>

          <div className="space-y-2.5">
            {allUsers.map((u) => (
              <div
                key={u.id}
                onClick={() => handleSelectUser(u.id)}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-xl object-cover" />
                  <div className="min-w-0">
                    <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 truncate">
                      {u.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {u.department} {u.clubName ? `• ${u.clubName}` : ''}
                    </div>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
