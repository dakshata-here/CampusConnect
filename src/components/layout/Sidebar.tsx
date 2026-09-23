import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Calendar,
  Sparkles,
  Users,
  Award,
  Clock,
  CheckCircle2,
  FileText,
  MapPin,
  BarChart3,
  Settings,
  Bell,
  PlusCircle,
  QrCode,
  GraduationCap,
  BookmarkCheck,
  Building2,
  HelpCircle,
  X
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    events,
    registrations,
    clubs,
    setIsCreateEventOpen,
    setIsQrScannerOpen
  } = useApp();

  // Count pending reviews for President or Admin
  const pendingApprovalsCount = events.filter(
    (e) =>
      (e.status === 'pending_approval' || (currentUser.role === 'president' && e.status === 'changes_requested')) &&
      (currentUser.role === 'college_admin' || (currentUser.role === 'president' && e.clubId === currentUser.clubId))
  ).length;

  // Count user registrations
  const userRegisteredCount = registrations.filter(
    (r) => r.studentId === currentUser.id && r.attendanceStatus === 'registered'
  ).length;

  interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: string | number;
    badgeColor?: string;
    action?: () => void;
  }

  const getNavItems = (): { section: string; items: NavItem[] }[] => {
    switch (currentUser.role) {
      case 'student':
        return [
          {
            section: 'STUDENT PORTAL',
            items: [
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'calendar', label: 'Campus Calendar', icon: Calendar },
              { id: 'events', label: 'Explore Events', icon: Sparkles },
              { id: 'academic', label: 'Academic Schedule', icon: GraduationCap },
              {
                id: 'my-events',
                label: 'My Registered Events',
                icon: BookmarkCheck,
                badge: userRegisteredCount > 0 ? userRegisteredCount : undefined,
                badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300'
              },
              { id: 'my-clubs', label: 'Clubs Directory', icon: Users }
            ]
          }
        ];

      case 'president':
        return [
          {
            section: 'PRESIDENT CONTROL',
            items: [
              { id: 'dashboard', label: 'Club Dashboard', icon: LayoutDashboard },
              { id: 'my-club', label: 'My Club Hub', icon: Building2 },
              {
                id: 'event-requests',
                label: 'Submitted Proposals',
                icon: Clock,
                badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
                badgeColor: 'bg-amber-500 text-white animate-pulse'
              },
              { id: 'calendar', label: 'Master Calendar', icon: Calendar },
              { id: 'academic', label: 'Academic Milestones', icon: GraduationCap },
              { id: 'members', label: 'Club Members', icon: Users },
              { id: 'registrations', label: 'Registrations', icon: FileText },
              { id: 'analytics', label: 'Club Analytics', icon: BarChart3 }
            ]
          }
        ];

      case 'subhead':
        return [
          {
            section: 'SUBHEAD WORKSPACE',
            items: [
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              {
                id: 'create-proposal',
                label: 'New Event Proposal',
                icon: PlusCircle,
                action: () => setIsCreateEventOpen(true)
              },
              { id: 'my-proposals', label: 'My Proposals', icon: FileText },
              { id: 'events', label: 'All Club Events', icon: Sparkles },
              { id: 'calendar', label: 'Master Calendar', icon: Calendar },
              { id: 'registrations', label: 'Event Registrations', icon: BookmarkCheck }
            ]
          }
        ];

      case 'college_admin':
        return [
          {
            section: 'COLLEGE ADMINISTRATION',
            items: [
              { id: 'dashboard', label: 'Admin Overview', icon: LayoutDashboard },
              { id: 'students-admin', label: 'Students Directory', icon: Users },
              { id: 'academic-calendar-admin', label: 'Academic Calendar', icon: GraduationCap },
              { id: 'venues-admin', label: 'Venues & Halls', icon: MapPin },
              {
                id: 'approvals-admin',
                label: 'Approvals Override',
                icon: CheckCircle2,
                badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
                badgeColor: 'bg-purple-600 text-white'
              },
              { id: 'settings', label: 'System Settings', icon: Settings }
            ]
          }
        ];

      default:
        return [];
    }
  };

  const navSections = getNavItems();

  const handleItemClick = (item: NavItem) => {
    if (item.action) {
      item.action();
    } else {
      setActiveTab(item.id);
    }
    onCloseMobile();
  };

  return (
    <>
<<<<<<< HEAD
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
=======
      {/* Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 transition-opacity"
>>>>>>> eff49e3 (First commit)
        />
      )}

      {/* Sidebar Container */}
      <aside
<<<<<<< HEAD
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
        } flex flex-col justify-between overflow-y-auto`}
      >
        <div className="p-5 space-y-6">
          {/* Close button on mobile */}
          <div className="flex items-center justify-between lg:hidden pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Navigation</span>
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
=======
        className={`fixed top-16 bottom-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full pointer-events-none'
        } flex flex-col justify-between overflow-y-auto`}
      >
        <div className="p-5 space-y-6">
          {/* Header & Close button */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Navigation Menu</span>
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none transition-colors"
              title="Close Sidebar"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
>>>>>>> eff49e3 (First commit)
            </button>
          </div>

          {/* Nav List */}
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 mb-2">
                {section.section}
              </div>
              <nav className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            item.badgeColor || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}

          {/* Subscriptions Section */}
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Subscriptions</p>
            <div
              onClick={() => setActiveTab('my-clubs')}
              className="flex items-center justify-between px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
            >
              <span className="flex items-center space-x-2.5">
                <span>⭐</span>
                <span className="font-medium">ACM PICT</span>
              </span>
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            </div>
            <div
              onClick={() => setActiveTab('my-clubs')}
              className="flex items-center justify-between px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
            >
              <span className="flex items-center space-x-2.5">
                <span>⭐</span>
                <span className="font-medium">IEEE Branch</span>
              </span>
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            </div>
            <div
              onClick={() => setActiveTab('my-clubs')}
              className="flex items-center justify-between px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
            >
              <span className="flex items-center space-x-2.5">
                <span>☆</span>
                <span className="font-medium">Robotics Club</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Quick Summary Card */}
        <div className="p-4 m-4 bg-slate-900 rounded-xl text-white space-y-2">
          <p className="text-xs font-semibold opacity-70">Quick Summary</p>
          <div className="flex justify-between text-base font-bold">
            <span>Events Attended</span>
            <span>{registrations.filter((r) => r.attendanceStatus === 'attended').length || 14}</span>
          </div>
          <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-400 w-2/3 h-full rounded-full"></div>
          </div>
          <p className="text-[10px] opacity-60">Next Goal: 20 Events for Gold Badge</p>
        </div>
      </aside>
    </>
  );
};
