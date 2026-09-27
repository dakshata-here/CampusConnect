import React from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, Sparkles, User, RefreshCw, Sun, Moon, LogOut } from 'lucide-react';

export const RoleSwitcherBar: React.FC = () => {
  const {
    currentUser,
    allUsers,
    switchUser,
    activeTab,
    setActiveTab,
    isDarkMode,
    toggleDarkMode,
    resetDatabase
  } = useApp();

  const handlePersonaClick = (userId: string) => {
    switchUser(userId);
    if (activeTab === 'login' || activeTab === 'landing') {
      setActiveTab('dashboard');
    }
  };

  return (
    <aside aria-label="Demo role selector" className="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-800 text-xs px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 z-50 transition-colors">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="flex items-center gap-1 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] mr-1">
          Demo Persona:
        </span>

        {allUsers.map((user) => {
          const isSelected = currentUser.id === user.id && activeTab !== 'landing' && activeTab !== 'login';

          return (
            <button
              key={user.id}
              onClick={() => handlePersonaClick(user.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors text-xs font-semibold border ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
              title={`Switch to ${user.name} (${user.role})`}
            >
              <span>{user.name.split(' ')[0]}</span>
              <span className="opacity-75 text-[10px]">
                ({user.role === 'college_admin' ? 'Admin' : user.role === 'president' ? `${user.clubName?.split(' ')[0]}` : user.role === 'subhead' ? 'Subhead' : 'Student'})
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        <button
          onClick={() => setActiveTab('login')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs transition-colors font-semibold ${
            activeTab === 'login'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
          title="Open Login Screen"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Login Page</span>
        </button>

        <button
          onClick={() => setActiveTab(activeTab === 'landing' ? 'dashboard' : 'landing')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs transition-colors font-semibold ${
            activeTab === 'landing'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
          title="Toggle Public Website View"
        >
          <User className="w-3.5 h-3.5" />
          <span>{activeTab === 'landing' ? 'Dashboard' : 'Website'}</span>
        </button>

        <button
          onClick={toggleDarkMode}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors font-semibold shadow-xs"
          title={isDarkMode ? 'Switch to Bright Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px]">Bright</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-[11px]">Dark</span>
            </>
          )}
        </button>

        <button
          onClick={() => {
            if (confirm('Clear and reset local database?')) {
              resetDatabase();
            }
          }}
          className="p-1 rounded-md bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-300 border border-slate-200 dark:border-slate-700 transition-colors"
          title="Reset database"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
