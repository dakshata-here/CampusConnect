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
  GraduationCap
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
        if (currentUser.role === 'student') return <StudentDashboard />;
        if (currentUser.role === 'president') return <PresidentDashboard />;
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
          ['published', 'approved', 'registration_open', 'completed'].includes(e.status)
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

<<<<<<< HEAD
      {/* Body with Fixed Sidebar and Fluid Content Area */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
=======
      {/* Body with Toggleable Drawer Sidebar and Fluid Content Area */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto relative">
>>>>>>> eff49e3 (First commit)
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Main Content Viewport */}
<<<<<<< HEAD
        <main className="flex-1 lg:pl-64 p-4 sm:p-6 lg:p-8 min-w-0 transition-all">
=======
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 transition-all">
>>>>>>> eff49e3 (First commit)
          <div className="max-w-6xl mx-auto">{renderMainContent()}</div>
        </main>
      </div>

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

