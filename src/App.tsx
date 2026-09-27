import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { StudentDashboard } from './components/dashboard/StudentDashboard';
import { PresidentDashboard } from './components/dashboard/PresidentDashboard';
import { SubheadDashboard } from './components/dashboard/SubheadDashboard';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { SubmittedProposalsView } from './components/dashboard/SubmittedProposalsView';
import { ClubMembersView } from './components/dashboard/ClubMembersView';
import { RegistrationsView } from './components/dashboard/RegistrationsView';
import { ClubAnalyticsView } from './components/dashboard/ClubAnalyticsView';
import { CentralCalendar } from './components/calendar/CentralCalendar';
import { ClubsDirectory } from './components/clubs/ClubsDirectory';
import { VenuesManagement } from './components/venues/VenuesManagement';
import { StudentProfileView } from './components/profile/StudentProfileView';
import { EventCard } from './components/events/EventCard';
import { EventDetailsModal } from './components/events/EventDetailsModal';
import { CreateEventModal } from './components/events/CreateEventModal';
import { ApprovalReviewModal } from './components/events/ApprovalReviewModal';
import { QRScannerModal } from './components/attendance/QRScannerModal';
import { CertificateModal } from './components/certificates/CertificateModal';
import { FeedbackModal } from './components/feedback/FeedbackModal';
import { RegistrationReviewModal } from './components/auth/RegistrationReviewModal';
import { AuthModal } from './components/auth/AuthModal';
import { LoginPage } from './components/auth/LoginPage';
import { AcademicCalendarView } from './components/academic/AcademicCalendarView';
import { ApprovalOverrideView } from './components/admin/ApprovalOverrideView';
import { SystemSettingsView } from './components/admin/SystemSettingsView';
import {
  Calendar,
  Sparkles,
  Award,
  Filter,
  Users,
  Building2,
  MapPin,
  Clock,
  PlusCircle,
  GraduationCap,
  LayoutDashboard,
  BookmarkCheck,
  Menu
} from 'lucide-react';

export function App() {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    events,
    selectedEventForModal,
    setSelectedEventForModal,
    isCreateEventOpen,
    setIsCreateEventOpen,
    selectedEventForApproval,
    setSelectedEventForApproval,
    isQrScannerOpen,
    setIsQrScannerOpen,
    selectedCertificate,
    setSelectedCertificate,
    isFeedbackModalOpen,
    setIsFeedbackModalOpen,
    feedbackTargetEvent,
    selectedRegistrationForReview,
    setSelectedRegistrationForReview,
    isAuthModalOpen,
    setIsAuthModalOpen,
    searchQuery
  } = useApp();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [eventCategoryFilter, setEventCategoryFilter] = useState('all');

  // If viewing initial login page
  if (activeTab === 'login') {
    return <LoginPage />;
  }

  // Render role-specific dashboard or central views
  const renderMainContent = () => {
    switch (activeTab) {
      case 'dashboard':
        if (currentUser.role === 'student' && currentUser.leadType !== 'faculty') return <StudentDashboard />;
        if (currentUser.role === 'president' || currentUser.leadType === 'faculty') return <PresidentDashboard />;
        if (currentUser.role === 'subhead') return <SubheadDashboard />;
        if (currentUser.role === 'college_admin') return <AdminDashboard />;
        return <StudentDashboard />;

      case 'calendar':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-indigo-600" />
                Master Campus Calendar
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Unified schedule of college hackathons, workshops, technical SIGs, and academic examinations
              </p>
            </div>
            <CentralCalendar />
          </div>
        );

      case 'events':
      case 'approved-events':
      case 'events-admin': {
        const publishedEvents = events.filter((e) =>
          ['published', 'approved', 'registration_open', 'completed'].includes(e.status) && e.status !== 'cancelled'
        );
        const filtered = publishedEvents.filter((e) => {
          if (eventCategoryFilter === 'all') return true;
          if (eventCategoryFilter === 'hackathons')
            return ['Hackathon', 'Ideathon', 'Competition'].includes(e.eventType);
          if (eventCategoryFilter === 'workshops')
            return ['Workshop', 'SIG Session', 'Technical Event'].includes(e.eventType);
          if (eventCategoryFilter === 'academic') return e.category === 'academic';
          return true;
        });

        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-indigo-600" />
                  Explore Campus Events & Workshops
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Discover upcoming student activities across all campus clubs
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold overflow-x-auto">
                {[
                  { id: 'all', label: 'All Events' },
                  { id: 'workshops', label: 'Workshops & SIGs' },
                  { id: 'hackathons', label: 'Hackathons' },
                  { id: 'academic', label: 'Academic & Exams' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setEventCategoryFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                      eventCategoryFilter === f.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((evt) => (
                <EventCard key={evt.id} event={evt} />
              ))}
            </div>
          </div>
        );
      }

      case 'academic':
      case 'academic-calendar-admin':
        return <AcademicCalendarView />;

      case 'approvals-admin':
        return <ApprovalOverrideView />;

      case 'settings':
        return <SystemSettingsView />;

      case 'students-admin':
        return <AdminDashboard />;

      case 'my-events':
      case 'certificates':
      case 'profile':
        return <StudentProfileView />;

      case 'my-clubs':
      case 'my-club':
        return <ClubsDirectory />;

      case 'venues-admin':
        return <VenuesManagement />;

      case 'event-requests':
      case 'my-proposals':
        return <SubmittedProposalsView />;

      case 'members':
      case 'club-members':
        return <ClubMembersView />;

      case 'registrations':
      case 'event-registrations':
        return <RegistrationsView />;

      case 'analytics':
      case 'club-analytics':
        return <ClubAnalyticsView />;

      case 'approvals-admin':
        if (currentUser.role === 'college_admin') return <AdminDashboard />;
        return <SubmittedProposalsView />;

      default:
        return <StudentDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Main Navbar */}
      <Navbar
        onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Body with Toggleable Drawer Sidebar and Fluid Content Area */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto relative">
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 pb-24 md:pb-8 min-w-0 transition-all">
          <div className="max-w-6xl mx-auto">{renderMainContent()}</div>
        </main>
      </div>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'dashboard'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'calendar'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Calendar</span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'events'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Events</span>
        </button>

        {currentUser.role === 'student' ? (
          <button
            onClick={() => setActiveTab('my-events')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'my-events'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BookmarkCheck className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Passes</span>
          </button>
        ) : (
          <button
            onClick={() => setActiveTab(currentUser.role === 'college_admin' ? 'venues-admin' : 'my-club')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'my-club' || activeTab === 'venues-admin'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{currentUser.role === 'college_admin' ? 'Venues' : 'Club'}</span>
          </button>
        )}

        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all cursor-pointer"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Menu</span>
        </button>
      </nav>

      {/* Global Modals */}
      {selectedEventForModal && (
        <EventDetailsModal
          event={selectedEventForModal}
          onClose={() => setSelectedEventForModal(null)}
        />
      )}

      {isCreateEventOpen && (
        <CreateEventModal onClose={() => setIsCreateEventOpen(false)} />
      )}

      {selectedEventForApproval && (
        <ApprovalReviewModal
          event={selectedEventForApproval}
          onClose={() => setSelectedEventForApproval(null)}
        />
      )}

      {isQrScannerOpen && (
        <QRScannerModal onClose={() => setIsQrScannerOpen(false)} />
      )}

      {selectedCertificate && (
        <CertificateModal
          certificate={selectedCertificate}
          onClose={() => setSelectedCertificate(null)}
        />
      )}

      {isFeedbackModalOpen && feedbackTargetEvent && (
        <FeedbackModal
          event={feedbackTargetEvent}
          onClose={() => {
            setIsFeedbackModalOpen(false);
          }}
        />
      )}

      {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} />}

      {selectedRegistrationForReview && (
        <RegistrationReviewModal
          request={selectedRegistrationForReview}
          onClose={() => setSelectedRegistrationForReview(null)}
        />
      )}
    </div>
  );
}

export default App;

