import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserRole,
  CampusEvent,
  Club,
  Venue,
  Registration,
  Reminder,
  AppNotification,
  EventFeedback,
  Certificate,
  UserRegistrationRequest,
  ClubLeadMessage,
  ClubLeadTask,
  EventBroadcastEmail,
  AcademicNotice,
  SystemSettings
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_CLUBS,
  INITIAL_VENUES,
  INITIAL_EVENTS,
  INITIAL_REGISTRATIONS,
  INITIAL_CERTIFICATES,
  INITIAL_FEEDBACK,
  INITIAL_NOTIFICATIONS,
  INITIAL_CLUB_MESSAGES,
  INITIAL_CLUB_TASKS,
  INITIAL_ACADEMIC_NOTICES,
  INITIAL_SYSTEM_SETTINGS,
  DEFAULT_EVENT_IDS,
  DEFAULT_EVENT_TITLES,
  DEFAULT_ACADEMIC_NOTICE_IDS
} from '../data/seedData';
import confetti from 'canvas-confetti';

interface AppContextType {
  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Auth & User
  currentUser: User;
  setCurrentUser: (user: User) => void;
  allUsers: User[];
  switchUser: (userId: string) => void;
  loginUser: (identifier: string, role: UserRole) => boolean;
  registerStudent: (data: {
    name: string;
    email: string;
    enrollmentNumber: string;
    department: string;
    year: string;
    phone: string;
  }) => boolean;
  registerUser: (data: {
    name: string;
    email: string;
    role: UserRole;
    enrollmentNumber: string;
    department: string;
    year: string;
    phone: string;
    clubId?: string;
    clubName?: string;
    securityQuestions?: { question: string; answer: string }[];
  }) => boolean;
  logout: () => void;

  // Events
  events: CampusEvent[];
  createEventProposal: (eventData: Partial<CampusEvent>) => CampusEvent;
  updateEvent: (eventId: string, updates: Partial<CampusEvent>) => void;
  approveEvent: (eventId: string, reviewerComment?: string) => void;
  rejectEvent: (eventId: string, reason: string) => void;
  requestChanges: (eventId: string, comment: string) => void;
  resubmitEventProposal: (eventId: string, updates: Partial<CampusEvent>) => void;
  leadRequestChangesOnApproved: (eventId: string, reason: string, updates?: Partial<CampusEvent>) => void;
  rescheduleEvent: (
    eventId: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string,
    newVenueId: string,
    reason: string
  ) => void;
  cancelEvent: (eventId: string, reason: string) => void;

  // Clubs
  clubs: Club[];
  followClub: (clubId: string) => void;
  unfollowClub: (clubId: string) => void;
  addClub: (clubData: Partial<Club>) => void;
  updateClub: (clubId: string, updates: Partial<Club>) => void;
  toggleClubStatus: (clubId: string) => void;
  assignPresident: (clubId: string, newPresidentId: string) => void;

  // Venues
  venues: Venue[];
  addVenue: (venueData: Partial<Venue>) => void;
  updateVenue: (venueId: string, updates: Partial<Venue>) => void;
  toggleVenueAvailability: (venueId: string) => void;

  // Registrations & QR Attendance
  registrations: Registration[];
  registerForEvent: (eventId: string, teamName?: string, phone?: string) => { success: boolean; message: string; registration?: Registration };
  cancelRegistration: (registrationId: string) => void;
  markAttendance: (registrationId: string) => boolean;
  markAttendanceByQrCode: (qrString: string) => { success: boolean; message: string; registration?: Registration };

  // Reminders
  reminders: Reminder[];
  setEventReminder: (eventId: string, option: Reminder['reminderOption']) => void;
  removeEventReminder: (reminderId: string) => void;

  // Notifications
  notifications: AppNotification[];
  markNotificationRead: (notifId: string) => void;
  markAllNotificationsRead: () => void;
  unreadNotificationsCount: number;

  // Feedback
  feedbacks: EventFeedback[];
  submitFeedback: (data: {
    eventId: string;
    rating: number;
    usefulnessRating: number;
    organizationRating: number;
    comments: string;
    suggestions: string;
  }) => void;

  // Certificates
  certificates: Certificate[];

  // Global search & Active views
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Modals state
  selectedEventForModal: CampusEvent | null;
  setSelectedEventForModal: (event: CampusEvent | null) => void;
  selectedEventForApproval: CampusEvent | null;
  setSelectedEventForApproval: (event: CampusEvent | null) => void;
  isCreateEventOpen: boolean;
  setIsCreateEventOpen: (open: boolean) => void;
  isQrScannerOpen: boolean;
  setIsQrScannerOpen: (open: boolean) => void;
  selectedCertificate: Certificate | null;
  setSelectedCertificate: (cert: Certificate | null) => void;
  isFeedbackModalOpen: boolean;
  setIsFeedbackModalOpen: (open: boolean) => void;
  feedbackTargetEvent: CampusEvent | null;
  setFeedbackTargetEvent: (event: CampusEvent | null) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;

  // Registration requests & review (Club Lead & Admin approvals)
  registrationRequests: UserRegistrationRequest[];
  submitRegistrationRequest: (data: Omit<UserRegistrationRequest, 'id' | 'status' | 'submittedAt'>) => UserRegistrationRequest;
  updateRegistrationRequestStatus: (requestId: string, status: 'pending' | 'approved' | 'rejected') => void;
  selectedRegistrationForReview: UserRegistrationRequest | null;
  setSelectedRegistrationForReview: (request: UserRegistrationRequest | null) => void;

  // Club Lead Chat & Task Management
  clubMessages: ClubLeadMessage[];
  sendClubMessage: (clubId: string, message: string, taggedEventTitle?: string) => void;
  clubTasks: ClubLeadTask[];
  addClubTask: (task: Omit<ClubLeadTask, 'id' | 'createdAt'>) => void;
  toggleClubTaskStatus: (taskId: string) => void;
  deleteClubTask: (taskId: string) => void;

  // Registered Students Broadcast Emails
  broadcastEmails: EventBroadcastEmail[];
  sendEventBroadcastEmail: (emailData: Omit<EventBroadcastEmail, 'id' | 'sentAt'>) => void;

  // Academic Notices & Calendar
  academicNotices: AcademicNotice[];
  addAcademicNotice: (notice: Omit<AcademicNotice, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'createdByName'>) => void;
  updateAcademicNotice: (id: string, updates: Partial<AcademicNotice>) => void;
  deleteAcademicNotice: (id: string) => void;
  toggleAcademicNoticeCalendar: (id: string) => void;

  // System Settings
  systemSettings: SystemSettings;
  updateSystemSettings: (updates: Partial<SystemSettings>) => void;

  // Reset database to initial
  resetDatabase: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('campusconnect_theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('campusconnect_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('campusconnect_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  // Load / Store in LocalStorage helper
  const usePersistedState = <T,>(
    key: string,
    initialValue: T,
    sanitize?: (val: T) => T
  ): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [state, setState] = useState<T>(() => {
      try {
        const item = localStorage.getItem(`campusconnect_${key}`);
        const parsed = item ? JSON.parse(item) : initialValue;
        const sanitized = sanitize ? sanitize(parsed) : parsed;
        if (
          Array.isArray(sanitized) &&
          sanitized.length === 0 &&
          Array.isArray(initialValue) &&
          initialValue.length > 0
        ) {
          return initialValue;
        }
        return sanitized;
      } catch {
        return sanitize ? sanitize(initialValue) : initialValue;
      }
    });

    useEffect(() => {
      try {
        localStorage.setItem(`campusconnect_${key}`, JSON.stringify(state));
      } catch (err) {
        console.error('Failed to save to localStorage', err);
      }
    }, [key, state]);

    return [state, setState];
  };

  const isDefaultEvent = (e: CampusEvent) =>
    DEFAULT_EVENT_IDS.has(e.id) || DEFAULT_EVENT_TITLES.has(e.title);

  const [allUsers, setAllUsers] = usePersistedState<User[]>('users', INITIAL_USERS);
  const [currentUser, setCurrentUser] = usePersistedState<User>('currentUser', INITIAL_USERS[0]); // Default Rahul
  const [clubs, setClubs] = usePersistedState<Club[]>('clubs', INITIAL_CLUBS);
  const [venues, setVenues] = usePersistedState<Venue[]>('venues', INITIAL_VENUES);
  const [events, setEvents] = usePersistedState<CampusEvent[]>(
    'events',
    INITIAL_EVENTS,
    (evts) => evts.filter((e) => !isDefaultEvent(e))
  );
  const [registrations, setRegistrations] = usePersistedState<Registration[]>(
    'registrations',
    INITIAL_REGISTRATIONS,
    (regs) => regs.filter((r) => !DEFAULT_EVENT_IDS.has(r.eventId) && !DEFAULT_EVENT_TITLES.has(r.eventTitle))
  );
  const [reminders, setReminders] = usePersistedState<Reminder[]>('reminders', []);
  const [notifications, setNotifications] = usePersistedState<AppNotification[]>(
    'notifications',
    INITIAL_NOTIFICATIONS,
    (notifs) =>
      notifs.filter(
        (n) =>
          (!n.eventId || !DEFAULT_EVENT_IDS.has(n.eventId)) &&
          n.id !== 'notif_sample_changes' &&
          n.id !== 'notif_reg_sample_1' &&
          n.registrationRequestId !== 'req_sample_1'
      )
  );
  const [feedbacks, setFeedbacks] = usePersistedState<EventFeedback[]>(
    'feedbacks',
    INITIAL_FEEDBACK,
    (fbs) => fbs.filter((f) => !DEFAULT_EVENT_IDS.has(f.eventId) && !DEFAULT_EVENT_TITLES.has(f.eventTitle))
  );
  const [certificates, setCertificates] = usePersistedState<Certificate[]>(
    'certificates',
    INITIAL_CERTIFICATES,
    (certs) => certs.filter((c) => !DEFAULT_EVENT_IDS.has(c.eventId) && !DEFAULT_EVENT_TITLES.has(c.eventTitle))
  );
  const [registrationRequests, setRegistrationRequests] = usePersistedState<UserRegistrationRequest[]>(
    'registration_requests',
    [],
    (reqs) => reqs.filter((r) => r.id !== 'req_sample_1')
  );
  const [clubMessages, setClubMessages] = usePersistedState<ClubLeadMessage[]>(
    'club_messages',
    INITIAL_CLUB_MESSAGES,
    (msgs) => msgs.filter((m) => !['msg_1', 'msg_2', 'msg_3', 'msg_4', 'msg_5'].includes(m.id))
  );
  const [clubTasks, setClubTasks] = usePersistedState<ClubLeadTask[]>(
    'club_tasks',
    INITIAL_CLUB_TASKS,
    (tasks) => tasks.filter((t) => !['task_1', 'task_2', 'task_3', 'task_4'].includes(t.id))
  );
  const [broadcastEmails, setBroadcastEmails] = usePersistedState<EventBroadcastEmail[]>(
    'broadcast_emails',
    []
  );
  const [academicNotices, setAcademicNotices] = usePersistedState<AcademicNotice[]>(
    'academic_notices',
    INITIAL_ACADEMIC_NOTICES,
    (notices) => notices.filter((n) => !DEFAULT_ACADEMIC_NOTICE_IDS.has(n.id))
  );
  const [systemSettings, setSystemSettings] = usePersistedState<SystemSettings>(
    'system_settings',
    INITIAL_SYSTEM_SETTINGS
  );
  const [selectedRegistrationForReview, setSelectedRegistrationForReview] = useState<UserRegistrationRequest | null>(null);

  // Global UI states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('login');
  const [selectedEventForModal, setSelectedEventForModal] = useState<CampusEvent | null>(null);
  const [selectedEventForApproval, setSelectedEventForApproval] = useState<CampusEvent | null>(null);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState<boolean>(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState<boolean>(false);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);
  const [feedbackTargetEvent, setFeedbackTargetEvent] = useState<CampusEvent | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // One-time purge of legacy dummy data stored in localStorage
  useEffect(() => {
    try {
      const purgeKey = 'campusconnect_cleaned_dummy_v5';
      if (!localStorage.getItem(purgeKey)) {
        localStorage.removeItem('campusconnect_events');
        localStorage.removeItem('campusconnect_registrations');
        localStorage.removeItem('campusconnect_notifications');
        localStorage.removeItem('campusconnect_club_messages');
        localStorage.removeItem('campusconnect_club_tasks');
        localStorage.removeItem('campusconnect_academic_notices');
        localStorage.removeItem('campusconnect_registration_requests');
        localStorage.removeItem('campusconnect_feedbacks');
        localStorage.removeItem('campusconnect_certificates');
        localStorage.setItem(purgeKey, 'true');
        setEvents([]);
        setRegistrations([]);
        setNotifications([]);
        setClubMessages([]);
        setClubTasks([]);
        setAcademicNotices([]);
        setRegistrationRequests([]);
        setFeedbacks([]);
        setCertificates([]);
      }
    } catch (err) {
      console.error('Purge error:', err);
    }
  }, []);

  // Switch active user
  const switchUser = (userId: string) => {
    const user = allUsers.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      // set appropriate landing tab
      if (user.role === 'college_admin') setActiveTab('dashboard');
      else if (user.role === 'president') setActiveTab('dashboard');
      else if (user.role === 'subhead') setActiveTab('dashboard');
      else setActiveTab('dashboard');
    }
  };

  const loginUser = (identifier: string, role: UserRole): boolean => {
    const found = allUsers.find(
      (u) =>
        u.role === role &&
        (u.email.toLowerCase() === identifier.toLowerCase() ||
          (u.enrollmentNumber && u.enrollmentNumber.toLowerCase() === identifier.toLowerCase()))
    );
    if (found) {
      setCurrentUser(found);
      setActiveTab('dashboard');
      return true;
    }
    // Fallback: pick first user with that role
    const fallback = allUsers.find((u) => u.role === role);
    if (fallback) {
      setCurrentUser(fallback);
      setActiveTab('dashboard');
      return true;
    }
    return false;
  };

  const registerStudent = (data: {
    name: string;
    email: string;
    enrollmentNumber: string;
    department: string;
    year: string;
    phone: string;
  }): boolean => {
    return registerUser({
      ...data,
      role: 'student'
    });
  };

  const registerUser = (data: {
    name: string;
    email: string;
    role: UserRole;
    enrollmentNumber: string;
    department: string;
    year: string;
    phone: string;
    clubId?: string;
    clubName?: string;
    securityQuestions?: { question: string; answer: string }[];
  }): boolean => {
    const newUser: User = {
      id: `user_${data.role}_${Date.now()}`,
      name: data.name,
      email: data.email,
      enrollmentNumber: data.enrollmentNumber,
      role: data.role,
      department: data.department,
      year: data.year,
      phone: data.phone,
      securityQuestions: data.securityQuestions,
      avatar:
        data.role === 'college_admin'
          ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
          : data.role === 'president'
          ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      followedClubs: ['club_ieee', 'club_acm'],
      clubId: data.clubId || (data.role === 'president' ? 'club_ieee' : undefined),
      clubName: data.clubName || (data.role === 'president' ? 'IEEE PICT Student Branch' : undefined)
    };
    setAllUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    setActiveTab('dashboard');
    return true;
  };

  const submitRegistrationRequest = (
    data: Omit<UserRegistrationRequest, 'id' | 'status' | 'submittedAt'>
  ): UserRegistrationRequest => {
    const newReq: UserRegistrationRequest = {
      ...data,
      id: `req_${Date.now()}`,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    setRegistrationRequests((prev) => [newReq, ...prev]);

    // Send notification to Admin dashboard, displayed by the Full Name entered!
    const notif: AppNotification = {
      id: `notif_reg_${Date.now()}`,
      userRole: 'college_admin',
      title: data.fullName, // displayed by the Full name entered while doing the new registration
      message: `New ${data.role === 'lead' ? 'Club Lead' : 'Admin'} registration application submitted by ${data.fullName}`,
      type: 'registration_request',
      registrationRequestId: newReq.id,
      registrationRequest: newReq,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    setNotifications((prev) => [notif, ...prev]);
    return newReq;
  };

  const updateRegistrationRequestStatus = (
    requestId: string,
    status: 'pending' | 'approved' | 'rejected'
  ) => {
    const reviewedTime = new Date().toISOString();
    setRegistrationRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status, reviewedAt: reviewedTime } : r))
    );

    setNotifications((prev) =>
      prev.map((n) => {
        if (
          n.registrationRequestId === requestId ||
          (n.registrationRequest && n.registrationRequest.id === requestId)
        ) {
          return {
            ...n,
            registrationRequest: {
              ...(n.registrationRequest || {}),
              status,
              reviewedAt: reviewedTime
            } as UserRegistrationRequest
          };
        }
        return n;
      })
    );

    setSelectedRegistrationForReview((prev) => {
      if (prev && prev.id === requestId) {
        return { ...prev, status, reviewedAt: reviewedTime };
      }
      return prev;
    });

    // If approved, ensure user exists in allUsers with approved role
    if (status === 'approved') {
      const targetReq = registrationRequests.find((r) => r.id === requestId);
      if (targetReq) {
        const existing = allUsers.find(
          (u) =>
            u.email.toLowerCase() === targetReq.email.toLowerCase() ||
            (u.enrollmentNumber && u.enrollmentNumber.toLowerCase() === targetReq.idNumber.toLowerCase())
        );
        if (!existing) {
          const newUser: User = {
            id: `user_${Date.now()}`,
            name: targetReq.fullName,
            email: targetReq.email,
            role:
              targetReq.role === 'admin'
                ? 'college_admin'
                : targetReq.role === 'lead'
                ? 'president'
                : 'student',
            enrollmentNumber: targetReq.idNumber,
            department: targetReq.department,
            year: targetReq.year,
            phone: targetReq.phone,
            clubId: targetReq.clubId || (targetReq.role === 'lead' ? 'club_ieee' : undefined),
            clubName: targetReq.clubName || (targetReq.role === 'lead' ? 'College Club' : undefined),
            avatar:
              targetReq.role === 'admin'
                ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
                : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
            followedClubs: ['club_ieee', 'club_acm'],
            securityQuestions: targetReq.securityQuestions
          };
          setAllUsers((prev) => [...prev, newUser]);
        }
      }
    }
  };

  const logout = () => {
    // Switch to default student or login screen
    setCurrentUser(INITIAL_USERS[0]);
    setActiveTab('login');
  };

  // Follow / Unfollow club
  const followClub = (clubId: string) => {
    if (!currentUser.followedClubs.includes(clubId)) {
      const updated = { ...currentUser, followedClubs: [...currentUser.followedClubs, clubId] };
      setCurrentUser(updated);
      setAllUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));

      const club = clubs.find((c) => c.id === clubId);
      addNotification({
        title: `Following ${club?.shortName || club?.name}`,
        message: `You will now receive instant notifications whenever ${club?.shortName || 'this club'} publishes approved events!`,
        type: 'success',
        userId: currentUser.id
      });
    }
  };

  const unfollowClub = (clubId: string) => {
    const updated = {
      ...currentUser,
      followedClubs: currentUser.followedClubs.filter((id) => id !== clubId)
    };
    setCurrentUser(updated);
    setAllUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
  };

  // Notification creation helper
  const addNotification = (notif: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Event Workflows
  const createEventProposal = (eventData: Partial<CampusEvent>): CampusEvent => {
    const club = clubs.find((c) => c.id === eventData.clubId);
    const venue = venues.find((v) => v.id === eventData.venueId);

    const isDirectApproved = currentUser.role === 'college_admin';
    const initialStatus = eventData.status || (isDirectApproved ? 'approved' : 'pending_approval');

    const newEvent: CampusEvent = {
      id: `evt_${Date.now()}`,
      clubId: eventData.clubId,
      clubName: club?.name || eventData.clubName || (eventData.category === 'academic' ? 'Academic Council' : 'College Club'),
      clubLogo: club?.logo,
      title: eventData.title || 'Untitled Event',
      eventType: eventData.eventType || 'Workshop',
      category: eventData.category || 'club',
      academicType: eventData.academicType,
      shortDescription: eventData.shortDescription || '',
      fullDescription: eventData.fullDescription || '',
      posterUrl:
        eventData.posterUrl ||
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
      organizerName: eventData.organizerName || currentUser.name,
      date: eventData.date || new Date().toISOString().split('T')[0],
      startTime: eventData.startTime || '10:00',
      endTime: eventData.endTime || '12:00',
      venueId: eventData.venueId || 'venue_room_301',
      venueName: venue?.name || eventData.venueName || 'Main Campus',
      registrationRequired: eventData.registrationRequired ?? true,
      registrationType: eventData.registrationType || 'internal',
      registrationLink: eventData.registrationLink,
      registrationQrUrl: eventData.registrationQrUrl,
      registrationDeadline: eventData.registrationDeadline,
      maxParticipants: eventData.maxParticipants || 100,
      currentRegistrations: 0,
      eligibility: eventData.eligibility || 'Open to all students',
      requiredMaterials: eventData.requiredMaterials,
      instructions: eventData.instructions,
      contactPerson: eventData.contactPerson || currentUser.name,
      contactEmail: eventData.contactEmail || currentUser.email,
      contactNumber: eventData.contactNumber || '+91 98000 00000',
      status: initialStatus,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdByRole: currentUser.role,
      tags: eventData.tags || [eventData.eventType || 'Event'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setEvents((prev) => [newEvent, ...prev]);

    // Send notifications
    if (initialStatus === 'pending_approval') {
      // 1. Notify the Submitter / Club Lead that approval has been sent to Admin
      addNotification({
        userId: currentUser.id,
        title: 'Approval Sent to Admin',
        message: `Your event proposal "${newEvent.title}" has been sent to College Admin for approval. It will appear on the calendar once approved.`,
        type: 'info',
        eventId: newEvent.id
      });

      // 2. Notify the College Admin of new event proposal needing review
      addNotification({
        userRole: 'college_admin',
        title: `New Event Proposal: ${newEvent.title}`,
        message: `Club Lead ${currentUser.name} (${newEvent.clubName || 'Club'}) proposed "${newEvent.title}". Review and approve to publish to campus.`,
        type: 'warning',
        eventId: newEvent.id
      });
    } else if (initialStatus === 'approved') {
      // Broadcast to students
      addNotification({
        title: `New Event: ${newEvent.title}`,
        message: `${newEvent.clubName} published a new event at ${newEvent.venueName}.`,
        type: 'info',
        eventId: newEvent.id
      });
    }

    return newEvent;
  };

  const updateEvent = (eventId: string, updates: Partial<CampusEvent>) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          return {
            ...e,
            ...updates,
            updatedAt: new Date().toISOString()
          };
        }
        return e;
      })
    );
  };

  const approveEvent = (eventId: string) => {
    const target = events.find((e) => e.id === eventId);
    if (!target) return;

    const updated: CampusEvent = {
      ...target,
      status: 'approved',
      approvedBy: currentUser.id,
      approvedByName: currentUser.name,
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setEvents((prev) => prev.map((e) => (e.id === eventId ? updated : e)));

    // Notify submitter
    addNotification({
      userId: target.createdBy,
      title: 'Event Proposal Approved! 🎉',
      message: `"${target.title}" was approved by ${currentUser.name} and is now published on the college calendar.`,
      type: 'success',
      eventId: target.id
    });

    // Notify students following this club
    allUsers
      .filter((u) => u.role === 'student' && target.clubId && u.followedClubs.includes(target.clubId))
      .forEach((stud) => {
        addNotification({
          userId: stud.id,
          title: `New Event from ${target.clubName}`,
          message: `"${target.title}" is scheduled for ${target.date} at ${target.venueName}. Seats available!`,
          type: 'info',
          eventId: target.id
        });
      });

    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch {
      // safe fallback
    }
  };

  const rejectEvent = (eventId: string, reason: string) => {
    const target = events.find((e) => e.id === eventId);
    if (!target) return;

    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              status: 'rejected',
              rejectionReason: reason,
              updatedAt: new Date().toISOString()
            }
          : e
      )
    );

    addNotification({
      userId: target.createdBy,
      title: 'Event Proposal Rejected by Admin',
      message: `Your proposal "${target.title}" was rejected by College Admin. Reason: ${reason}`,
      type: 'alert',
      eventId: target.id
    });
  };

  const requestChanges = (eventId: string, comment: string) => {
    const target = events.find((e) => e.id === eventId);
    if (!target) return;

    const currentComments = target.changeComments || [];

    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              status: 'changes_requested',
              changeComments: [comment, ...currentComments],
              updatedAt: new Date().toISOString()
            }
          : e
      )
    );

    // Notify the creator / Club Lead
    addNotification({
      userId: target.createdBy,
      title: 'Action Required: Changes Requested by Admin',
      message: `College Admin requested changes on "${target.title}": "${comment}". Please update the proposal and resubmit for Admin's approval.`,
      type: 'warning',
      eventId: target.id
    });

    // Also notify club president if creator was another subhead
    const president = allUsers.find((u) => u.role === 'president' && u.clubId === target.clubId);
    if (president && president.id !== target.createdBy) {
      addNotification({
        userId: president.id,
        title: 'Action Required: Changes Requested by Admin',
        message: `College Admin requested changes on "${target.title}": "${comment}". Please update the proposal and resubmit for Admin's approval.`,
        type: 'warning',
        eventId: target.id
      });
    }
  };

  const resubmitEventProposal = (eventId: string, updates: Partial<CampusEvent>) => {
    const target = events.find((e) => e.id === eventId);
    if (!target) return;

    const updatedEvent: CampusEvent = {
      ...target,
      ...updates,
      status: 'pending_approval',
      updatedAt: new Date().toISOString()
    };

    setEvents((prev) => prev.map((e) => (e.id === eventId ? updatedEvent : e)));

    // 1. Notify College Admin
    addNotification({
      userRole: 'college_admin',
      title: 'Event Proposal Resubmitted for Admin Approval',
      message: `Club Lead ${currentUser.name} (${target.clubName || 'Club'}) updated and resubmitted "${updatedEvent.title}" for Admin approval.`,
      type: 'warning',
      eventId: target.id
    });

    // 2. Notify Club Lead
    addNotification({
      userId: currentUser.id,
      title: "Resubmitted for Admin's Approval",
      message: `Your changes for "${updatedEvent.title}" have been submitted to College Admin for review and approval.`,
      type: 'success',
      eventId: target.id
    });
  };

  const leadRequestChangesOnApproved = (
    eventId: string,
    reason: string,
    updates?: Partial<CampusEvent>
  ) => {
    const target = events.find((e) => e.id === eventId);
    if (!target) return;

    const note = `Club Lead Modification Request: ${reason}`;
    const currentComments = target.changeComments || [];

    const updatedEvent: CampusEvent = {
      ...target,
      ...(updates || {}),
      status: 'changes_requested',
      changeComments: [note, ...currentComments],
      updatedAt: new Date().toISOString()
    };

    setEvents((prev) => prev.map((e) => (e.id === eventId ? updatedEvent : e)));

    addNotification({
      userRole: 'college_admin',
      title: 'Modifications Requested on Approved Event',
      message: `${currentUser.name} (${target.clubName}) requested changes for approved event "${target.title}": "${reason}". Resubmission awaiting review.`,
      type: 'warning',
      eventId: target.id
    });

    addNotification({
      userId: currentUser.id,
      title: 'Changes Saved — Ready to Re-submit',
      message: `Your changes for "${target.title}" have been saved. Click "Re-submit to Admin" to send the revised proposal to College Admin for approval.`,
      type: 'info',
      eventId: target.id
    });
  };

  const sendClubMessage = (clubId: string, message: string, taggedEventTitle?: string) => {
    const newMsg: ClubLeadMessage = {
      id: `msg_${Date.now()}`,
      clubId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole:
        currentUser.role === 'president'
          ? 'Club President'
          : currentUser.role === 'subhead'
          ? 'Club Subhead'
          : 'Lead Member',
      senderAvatar: currentUser.avatar,
      message,
      timestamp: new Date().toISOString(),
      taggedEventTitle
    };
    setClubMessages((prev) => [...prev, newMsg]);
  };

  const addClubTask = (task: Omit<ClubLeadTask, 'id' | 'createdAt'>) => {
    const newTask: ClubLeadTask = {
      ...task,
      id: `task_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setClubTasks((prev) => [newTask, ...prev]);
  };

  const toggleClubTaskStatus = (taskId: string) => {
    setClubTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const nextStatus: ClubLeadTask['status'] =
          t.status === 'pending'
            ? 'in_progress'
            : t.status === 'in_progress'
            ? 'completed'
            : 'pending';
        return { ...t, status: nextStatus };
      })
    );
  };

  const deleteClubTask = (taskId: string) => {
    setClubTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const sendEventBroadcastEmail = (emailData: Omit<EventBroadcastEmail, 'id' | 'sentAt'>) => {
    const newEmail: EventBroadcastEmail = {
      ...emailData,
      id: `email_${Date.now()}`,
      sentAt: new Date().toISOString()
    };
    setBroadcastEmails((prev) => [newEmail, ...prev]);

    addNotification({
      userId: currentUser.id,
      title: `Email Broadcast Sent: ${emailData.subject}`,
      message: `Broadcast sent to ${emailData.recipientCount} registered students for "${emailData.eventTitle}".`,
      type: 'success',
      eventId: emailData.eventId
    });
  };

  // Event Change & Reschedule Engine with Automatic Diff Notification
  const rescheduleEvent = (
    eventId: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string,
    newVenueId: string,
    reason: string
  ) => {
    const target = events.find((e) => e.id === eventId);
    if (!target) return;

    const newVenue = venues.find((v) => v.id === newVenueId);
    const newVenueName = newVenue?.name || target.venueName;

    const oldSchedule = {
      oldDate: target.date,
      newDate: newDate,
      oldVenue: target.venueName,
      newVenue: newVenueName,
      oldTime: `${target.startTime} – ${target.endTime}`,
      newTime: `${newStartTime} – ${newEndTime}`,
      reason: reason,
      rescheduledAt: new Date().toISOString()
    };

    const updatedEvent: CampusEvent = {
      ...target,
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      venueId: newVenueId,
      venueName: newVenueName,
      status: 'postponed', // or approved with rescheduled flag
      rescheduledHistory: oldSchedule,
      updatedAt: new Date().toISOString()
    };

    setEvents((prev) => prev.map((e) => (e.id === eventId ? updatedEvent : e)));

    // Update existing registrations for this event to new date/venue
    setRegistrations((prev) =>
      prev.map((r) =>
        r.eventId === eventId
          ? {
              ...r,
              eventDate: newDate,
              eventTime: `${newStartTime} – ${newEndTime}`,
              venueName: newVenueName
            }
          : r
      )
    );

    // Notify all registered students of the change
    const registeredStudentIds = registrations.filter((r) => r.eventId === eventId).map((r) => r.studentId);

    registeredStudentIds.forEach((studentId) => {
      addNotification({
        userId: studentId,
        title: `⚠️ Event Rescheduled: ${target.title}`,
        message: `Notice: Date moved from ${oldSchedule.oldDate} to ${newDate}, Venue: ${newVenueName}. Reason: ${reason}`,
        type: 'event_update',
        eventId: target.id,
        changeDetails: {
          oldDate: oldSchedule.oldDate,
          newDate: newDate,
          oldVenue: oldSchedule.oldVenue,
          newVenue: newVenueName,
          oldTime: oldSchedule.oldTime,
          newTime: oldSchedule.newTime
        }
      });
    });
  };

  const cancelEvent = (eventId: string, reason: string) => {
    const target = events.find((e) => e.id === eventId);
    if (!target) return;

    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              status: 'cancelled',
              rejectionReason: reason,
              updatedAt: new Date().toISOString()
            }
          : e
      )
    );

    // Notify all registered students
    const registeredStudentIds = registrations.filter((r) => r.eventId === eventId).map((r) => r.studentId);
    registeredStudentIds.forEach((studentId) => {
      addNotification({
        userId: studentId,
        title: `❌ Event Cancelled: ${target.title}`,
        message: `This event has been cancelled by ${currentUser.name}. Reason: ${reason}`,
        type: 'alert',
        eventId: target.id
      });
    });
  };

  // Club Operations
  const addClub = (clubData: Partial<Club>) => {
    const newClub: Club = {
      id: `club_${Date.now()}`,
      name: clubData.name || 'New College Club',
      shortName: clubData.shortName || 'Club',
      description: clubData.description || '',
      logo:
        clubData.logo ||
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=120&auto=format&fit=crop&q=80',
      banner:
        clubData.banner ||
        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=900&auto=format&fit=crop&q=80',
      department: clubData.department || 'All Departments',
      facultyCoordinator: clubData.facultyCoordinator || 'Prof. Faculty Coordinator',
      presidentId: clubData.presidentId || '',
      presidentName: clubData.presidentName || 'Unassigned',
      presidentEmail: clubData.presidentEmail || '',
      subheadIds: [],
      memberCount: clubData.memberCount || 10,
      contactEmail: clubData.contactEmail || 'club@pict.edu',
      socialLinks: clubData.socialLinks || {},
      status: 'active',
      category: clubData.category || 'technical'
    };
    setClubs((prev) => [...prev, newClub]);
  };

  const updateClub = (clubId: string, updates: Partial<Club>) => {
    setClubs((prev) => prev.map((c) => (c.id === clubId ? { ...c, ...updates } : c)));
  };

  const toggleClubStatus = (clubId: string) => {
    setClubs((prev) =>
      prev.map((c) => (c.id === clubId ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' } : c))
    );
  };

  const assignPresident = (clubId: string, newPresidentId: string) => {
    const presUser = allUsers.find((u) => u.id === newPresidentId);
    if (!presUser) return;

    setClubs((prev) =>
      prev.map((c) =>
        c.id === clubId
          ? {
              ...c,
              presidentId: presUser.id,
              presidentName: presUser.name,
              presidentEmail: presUser.email
            }
          : c
      )
    );

    // Update user role to president if needed
    setAllUsers((prev) =>
      prev.map((u) => (u.id === newPresidentId ? { ...u, role: 'president', clubId: clubId } : u))
    );
  };

  // Venue Operations
  const addVenue = (venueData: Partial<Venue>) => {
    const newVenue: Venue = {
      id: `venue_${Date.now()}`,
      name: venueData.name || 'New Hall',
      building: venueData.building || 'Main Block',
      floor: venueData.floor || '1st Floor',
      capacity: venueData.capacity || 100,
      facilities: venueData.facilities || ['Projector', 'AC'],
      isAvailable: venueData.isAvailable ?? true
    };
    setVenues((prev) => [...prev, newVenue]);
  };

  const updateVenue = (venueId: string, updates: Partial<Venue>) => {
    setVenues((prev) => prev.map((v) => (v.id === venueId ? { ...v, ...updates } : v)));
  };

  const toggleVenueAvailability = (venueId: string) => {
    setVenues((prev) => prev.map((v) => (v.id === venueId ? { ...v, isAvailable: !v.isAvailable } : v)));
  };

  // Event Registration Logic
  const registerForEvent = (
    eventId: string,
    teamName?: string,
    phone?: string
  ): { success: boolean; message: string; registration?: Registration } => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return { success: false, message: 'Event not found.' };

    // Business Rule 13: Student cannot register twice
    const existing = registrations.find((r) => r.eventId === eventId && r.studentId === currentUser.id);
    if (existing) {
      return { success: false, message: 'You have already registered for this event!' };
    }

    // Business Rule 9: Capacity check
    if (event.currentRegistrations >= event.maxParticipants) {
      return { success: false, message: 'Registration full! Maximum capacity reached.' };
    }

    // Business Rule 10: Deadline check
    if (event.registrationDeadline) {
      const deadline = new Date(event.registrationDeadline).getTime();
      if (Date.now() > deadline) {
        return { success: false, message: 'Registration has closed for this event.' };
      }
    }

    const regId = `reg_${Date.now()}`;
    const qrData = `CC-${regId}-${event.id}-${currentUser.enrollmentNumber || currentUser.id}`;

    const newRegistration: Registration = {
      id: regId,
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      eventTime: `${event.startTime} – ${event.endTime}`,
      venueName: event.venueName,
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentEmail: currentUser.email,
      studentEnrollment: currentUser.enrollmentNumber || 'C2K23XXXXX',
      department: currentUser.department,
      year: currentUser.year || 'TE',
      phone: phone || currentUser.phone || '+91 98000 00000',
      teamName: teamName || '',
      registrationDate: new Date().toISOString(),
      attendanceStatus: 'registered',
      qrCodeData: qrData
    };

    setRegistrations((prev) => [newRegistration, ...prev]);

    // Increment count on event
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, currentRegistrations: e.currentRegistrations + 1 } : e))
    );

    // Notify student
    addNotification({
      userId: currentUser.id,
      title: 'Registration Confirmed! 🎟️',
      message: `Your registration for "${event.title}" is confirmed. Your QR check-in ticket is ready in My Events.`,
      type: 'success',
      eventId: event.id
    });

    try {
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    } catch {
      // safe
    }

    return { success: true, message: 'Successfully registered!', registration: newRegistration };
  };

  const cancelRegistration = (registrationId: string) => {
    const reg = registrations.find((r) => r.id === registrationId);
    if (!reg) return;

    setRegistrations((prev) => prev.filter((r) => r.id !== registrationId));

    // Decrement event registration count
    setEvents((prev) =>
      prev.map((e) => (e.id === reg.eventId ? { ...e, currentRegistrations: Math.max(0, e.currentRegistrations - 1) } : e))
    );

    addNotification({
      userId: currentUser.id,
      title: 'Registration Cancelled',
      message: `Your registration for "${reg.eventTitle}" was cancelled.`,
      type: 'warning'
    });
  };

  // QR Attendance System
  const markAttendance = (registrationId: string): boolean => {
    const reg = registrations.find((r) => r.id === registrationId);
    if (!reg) return false;

    setRegistrations((prev) =>
      prev.map((r) =>
        r.id === registrationId
          ? {
              ...r,
              attendanceStatus: 'attended',
              attendedAt: new Date().toISOString()
            }
          : r
      )
    );

    // Auto-generate Certificate for student
    const certId = `cert_${Date.now()}`;
    const certCode = `PICT-CERT-${Date.now().toString().slice(-4)}-${reg.studentEnrollment.slice(-4) || '2026'}`;
    const newCert: Certificate = {
      id: certId,
      registrationId: reg.id,
      eventId: reg.eventId,
      eventTitle: reg.eventTitle,
      eventDate: reg.eventDate,
      studentId: reg.studentId,
      studentName: reg.studentName,
      enrollmentNumber: reg.studentEnrollment,
      clubName: 'College Club',
      issueDate: new Date().toISOString().split('T')[0],
      certificateCode: certCode
    };

    setCertificates((prev) => [newCert, ...prev]);

    // Send congratulatory notification to student
    addNotification({
      userId: reg.studentId,
      title: 'Attendance Confirmed! ✅',
      message: `Your attendance for "${reg.eventTitle}" has been verified. Your verified participation certificate is now available!`,
      type: 'success',
      eventId: reg.eventId
    });

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.5 } });
    } catch {}

    return true;
  };

  const markAttendanceByQrCode = (
    qrString: string
  ): { success: boolean; message: string; registration?: Registration } => {
    const reg = registrations.find((r) => r.qrCodeData === qrString.trim());
    if (!reg) {
      return { success: false, message: 'Invalid or unrecognized QR Code ticket.' };
    }
    if (reg.attendanceStatus === 'attended') {
      return {
        success: false,
        message: `Student ${reg.studentName} (${reg.studentEnrollment}) is ALREADY marked present!`,
        registration: reg
      };
    }

    markAttendance(reg.id);
    return {
      success: true,
      message: `Successfully verified attendance for ${reg.studentName} (${reg.studentEnrollment})!`,
      registration: { ...reg, attendanceStatus: 'attended' }
    };
  };

  // Reminders
  const setEventReminder = (eventId: string, option: Reminder['reminderOption']) => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;

    const optMap = {
      '1_day': '1 day before',
      '6_hours': '6 hours before',
      '1_hour': '1 hour before',
      '30_mins': '30 minutes before'
    };

    const newReminder: Reminder = {
      id: `rem_${Date.now()}`,
      studentId: currentUser.id,
      eventId: event.id,
      eventTitle: event.title,
      reminderOption: option,
      reminderTimeText: optMap[option],
      createdAt: new Date().toISOString()
    };

    setReminders((prev) => [...prev.filter((r) => !(r.eventId === eventId && r.studentId === currentUser.id)), newReminder]);

    addNotification({
      userId: currentUser.id,
      title: 'Reminder Set 🔔',
      message: `We will alert you ${optMap[option]} the event "${event.title}".`,
      type: 'info',
      eventId: event.id
    });
  };

  const removeEventReminder = (reminderId: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== reminderId));
  };

  // Notification methods
  const markNotificationRead = (notifId: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadNotificationsCount = notifications.filter(
    (n) =>
      !n.isRead &&
      (!n.userId || n.userId === currentUser.id) &&
      (!n.userRole || n.userRole === currentUser.role)
  ).length;

  // Feedback Submission
  const submitFeedback = (data: {
    eventId: string;
    rating: number;
    usefulnessRating: number;
    organizationRating: number;
    comments: string;
    suggestions: string;
  }) => {
    const event = events.find((e) => e.id === data.eventId);
    const newFb: EventFeedback = {
      id: `fb_${Date.now()}`,
      eventId: data.eventId,
      eventTitle: event?.title || 'Campus Event',
      studentId: currentUser.id,
      studentName: currentUser.name,
      rating: data.rating,
      usefulnessRating: data.usefulnessRating,
      organizationRating: data.organizationRating,
      comments: data.comments,
      suggestions: data.suggestions,
      createdAt: new Date().toISOString()
    };

    setFeedbacks((prev) => [newFb, ...prev]);

    // Mark in registration
    setRegistrations((prev) =>
      prev.map((r) => (r.eventId === data.eventId && r.studentId === currentUser.id ? { ...r, hasFeedbackGiven: true } : r))
    );

    addNotification({
      userId: currentUser.id,
      title: 'Feedback Received ⭐',
      message: 'Thank you for rating and helping organizers improve college events!',
      type: 'success',
      eventId: data.eventId
    });
  };

  // Academic Notices
  const addAcademicNotice = (
    noticeData: Omit<AcademicNotice, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'createdByName'>
  ) => {
    const newNotice: AcademicNotice = {
      ...noticeData,
      id: `acad_${Date.now()}`,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      addedToCalendar: noticeData.status === 'Published' || noticeData.addedToCalendar
    };

    setAcademicNotices((prev) => [newNotice, ...prev]);

    if (newNotice.status === 'Published') {
      addNotification({
        title: `Official Academic Notice: ${newNotice.title}`,
        message: `Official notice published for ${newNotice.department} (${newNotice.year}): "${newNotice.title}" scheduled on ${newNotice.date} at ${newNotice.venue}.`,
        type: 'info'
      });
    }
  };

  const updateAcademicNotice = (id: string, updates: Partial<AcademicNotice>) => {
    const existing = academicNotices.find((n) => n.id === id);
    if (!existing) return;

    const wasPublished = existing.status === 'Published';
    const isNowPublished = updates.status === 'Published' || (wasPublished && updates.status !== 'Draft');

    const updated: AcademicNotice = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    setAcademicNotices((prev) => prev.map((n) => (n.id === id ? updated : n)));

    if (wasPublished || isNowPublished) {
      const dateChanged = updates.date && updates.date !== existing.date;
      const venueChanged = updates.venue && updates.venue !== existing.venue;
      const timeChanged =
        (updates.startTime && updates.startTime !== existing.startTime) ||
        (updates.endTime && updates.endTime !== existing.endTime);

      let changeDesc = `Your ${existing.eventType} ("${existing.title}") details have been updated by College Administration.`;
      if (dateChanged) {
        changeDesc = `Academic Calendar Update: Your ${existing.eventType} has been rescheduled from ${existing.date} to ${updates.date}.`;
      } else if (venueChanged) {
        changeDesc = `Academic Calendar Update: Venue for ${existing.eventType} ("${existing.title}") has been updated to ${updates.venue}.`;
      } else if (timeChanged) {
        changeDesc = `Academic Calendar Update: Timings for ${existing.eventType} ("${existing.title}") have been adjusted to ${updates.startTime || existing.startTime}.`;
      }

      addNotification({
        title: 'Academic Calendar Update',
        message: changeDesc,
        type: 'warning'
      });
    }
  };

  const deleteAcademicNotice = (id: string) => {
    const existing = academicNotices.find((n) => n.id === id);
    setAcademicNotices((prev) => prev.filter((n) => n.id !== id));
    if (existing && existing.status === 'Published') {
      addNotification({
        title: 'Academic Notice Cancelled',
        message: `Official academic milestone "${existing.title}" originally scheduled on ${existing.date} has been cancelled.`,
        type: 'info'
      });
    }
  };

  const toggleAcademicNoticeCalendar = (id: string) => {
    setAcademicNotices((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          const newState = !n.addedToCalendar;
          return { ...n, addedToCalendar: newState };
        }
        return n;
      })
    );
  };

  const updateSystemSettings = (updates: Partial<SystemSettings>) => {
    setSystemSettings((prev) => ({
      ...prev,
      ...updates
    }));
  };

  // Reset database
  const resetDatabase = () => {
    localStorage.clear();
    setAllUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setClubs(INITIAL_CLUBS);
    setVenues(INITIAL_VENUES);
    setEvents([]);
    setRegistrations([]);
    setReminders([]);
    setNotifications([]);
    setFeedbacks([]);
    setCertificates([]);
    setAcademicNotices([]);
    setRegistrationRequests([]);
    setClubMessages([]);
    setClubTasks([]);
    setSystemSettings(INITIAL_SYSTEM_SETTINGS);
    window.location.reload();
  };

  return (
    <AppContext.Provider
      value={{
        isDarkMode,
        toggleDarkMode,
        currentUser,
        setCurrentUser,
        allUsers,
        switchUser,
        loginUser,
        registerStudent,
        registerUser,
        logout,
        events,
        createEventProposal,
        updateEvent,
        approveEvent,
        rejectEvent,
        requestChanges,
        resubmitEventProposal,
        leadRequestChangesOnApproved,
        rescheduleEvent,
        cancelEvent,
        clubs,
        followClub,
        unfollowClub,
        addClub,
        updateClub,
        toggleClubStatus,
        assignPresident,
        venues,
        addVenue,
        updateVenue,
        toggleVenueAvailability,
        registrations,
        registerForEvent,
        cancelRegistration,
        markAttendance,
        markAttendanceByQrCode,
        reminders,
        setEventReminder,
        removeEventReminder,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        unreadNotificationsCount,
        feedbacks,
        submitFeedback,
        certificates,
        searchQuery,
        setSearchQuery,
        activeTab,
        setActiveTab,
        selectedEventForModal,
        setSelectedEventForModal,
        selectedEventForApproval,
        setSelectedEventForApproval,
        isCreateEventOpen,
        setIsCreateEventOpen,
        isQrScannerOpen,
        setIsQrScannerOpen,
        selectedCertificate,
        setSelectedCertificate,
        isFeedbackModalOpen,
        setIsFeedbackModalOpen,
        feedbackTargetEvent,
        setFeedbackTargetEvent,
        isAuthModalOpen,
        setIsAuthModalOpen,
        registrationRequests,
        submitRegistrationRequest,
        updateRegistrationRequestStatus,
        selectedRegistrationForReview,
        setSelectedRegistrationForReview,
        clubMessages,
        sendClubMessage,
        clubTasks,
        addClubTask,
        toggleClubTaskStatus,
        deleteClubTask,
        broadcastEmails,
        sendEventBroadcastEmail,
        academicNotices,
        addAcademicNotice,
        updateAcademicNotice,
        deleteAcademicNotice,
        toggleAcademicNoticeCalendar,
        systemSettings,
        updateSystemSettings,
        resetDatabase
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
