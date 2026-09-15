export type UserRole = 'student' | 'president' | 'subhead' | 'college_admin';

export interface User {
  id: string;
  name: string;
  email: string;
  enrollmentNumber?: string;
  role: UserRole;
  department: string;
  year?: string; // 'FE' | 'SE' | 'TE' | 'BE' or '1st Year' | '2nd Year' etc.
  clubId?: string; // For president and subhead
  clubName?: string;
  avatar: string;
  followedClubs: string[]; // array of clubIds
  phone?: string;
  bio?: string;
  securityQuestions?: { question: string; answer: string }[];
}

export type EventType =
  | 'Hackathon'
  | 'Ideathon'
  | 'SIG Session'
  | 'Workshop'
  | 'Seminar'
  | 'Competition'
  | 'Technical Event'
  | 'Cultural Event'
  | 'Sports Event'
  | 'Guest Lecture'
  | 'Webinar'
  | 'Orientation'
  | 'Academic'
  | 'Internal Exam'
  | 'End Sem Exam'
  | 'Project Submission'
  | 'Holiday'
  | 'College Fest'
  | 'Other';

export type EventStatus =
  | 'draft'
  | 'pending_approval'
  | 'changes_requested'
  | 'approved'
  | 'published'
  | 'registration_open'
  | 'registration_closed'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'postponed';

export interface CampusEvent {
  id: string;
  clubId?: string; // empty if college academic
  clubName?: string;
  clubLogo?: string;
  title: string;
  eventType: EventType;
  category: 'club' | 'academic';
  academicType?: 'exam' | 'deadline' | 'holiday' | 'fest' | 'general';
  shortDescription: string;
  fullDescription: string;
  posterUrl: string;
  organizerName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  venueId: string;
  venueName: string;
  
  // Registration fields
  registrationRequired: boolean;
  registrationType: 'internal' | 'external' | 'qr' | 'link';
  registrationLink?: string;
  registrationQrUrl?: string;
  registrationDeadline?: string;
  maxParticipants: number;
  currentRegistrations: number;
  
  // Additional info
  eligibility: string;
  requiredMaterials?: string;
  instructions?: string;
  contactPerson: string;
  contactEmail: string;
  contactNumber: string;
  
  // Status & approval tracking
  status: EventStatus;
  createdBy: string; // user id
  createdByName: string;
  createdByRole: UserRole;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  changeComments?: string[];
  
  // Meta
  isDontMiss?: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  
  // Change tracking for notifications
  rescheduledHistory?: {
    oldDate: string;
    newDate: string;
    oldVenue: string;
    newVenue: string;
    oldTime: string;
    newTime: string;
    reason: string;
    rescheduledAt: string;
  };
}

export interface Club {
  id: string;
  name: string;
  shortName: string;
  description: string;
  logo: string;
  banner: string;
  department: string;
  facultyCoordinator: string;
  presidentId: string;
  presidentName: string;
  presidentEmail: string;
  subheadIds: string[];
  memberCount: number;
  contactEmail: string;
  socialLinks: {
    instagram?: string;
    linkedin?: string;
    website?: string;
    github?: string;
  };
  status: 'active' | 'inactive';
  category: 'technical' | 'cultural' | 'sports' | 'entrepreneurship' | 'academic';
}

export interface Venue {
  id: string;
  name: string;
  building: string;
  floor: string;
  capacity: number;
  facilities: string[]; // e.g. ['Projector', 'Air Conditioned', 'Sound System', 'Wi-Fi', 'Podium']
  isAvailable: boolean;
}

export interface Registration {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  venueName: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentEnrollment: string;
  department: string;
  year: string;
  phone: string;
  teamName?: string;
  registrationDate: string;
  attendanceStatus: 'registered' | 'attended' | 'cancelled';
  attendedAt?: string;
  qrCodeData: string;
  qrCodeString?: string;
  hasFeedbackGiven?: boolean;
}

export interface Reminder {
  id: string;
  studentId: string;
  eventId: string;
  eventTitle: string;
  reminderOption: '1_day' | '6_hours' | '1_hour' | '30_mins';
  reminderTimeText: string;
  createdAt: string;
}

export interface UserRegistrationRequest {
  id: string;
  fullName: string;
  role: 'lead' | 'admin' | 'student';
  leadType?: 'student' | 'faculty';
  clubName?: string;
  clubId?: string;
  email: string;
  idNumber: string; // PRN or Employee ID
  department: string;
  year: string;
  phone: string;
  securityQuestions?: { question: string; answer: string }[];
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
}

export interface AppNotification {
  id: string;
  userId?: string; // if null, broadcast
  userRole?: UserRole;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert' | 'event_update' | 'registration_request';
  eventId?: string;
  registrationRequestId?: string;
  registrationRequest?: UserRegistrationRequest;
  isRead: boolean;
  createdAt: string;
  changeDetails?: {
    oldDate?: string;
    newDate?: string;
    oldVenue?: string;
    newVenue?: string;
    oldTime?: string;
    newTime?: string;
  };
}

export interface EventFeedback {
  id: string;
  eventId: string;
  eventTitle: string;
  studentId: string;
  studentName: string;
  rating: number; // 1-5
  usefulnessRating: number; // 1-5
  organizationRating: number; // 1-5
  comments: string;
  suggestions: string;
  createdAt: string;
}

export interface Certificate {
  id: string;
  registrationId: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  studentId: string;
  studentName: string;
  enrollmentNumber: string;
  clubName: string;
  issueDate: string;
  certificateCode: string;
  certificateNumber?: string;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  type?: 'venue' | 'time' | 'both';
  conflictingEvent?: CampusEvent;
  message?: string;
}

export interface ClubLeadMessage {
  id: string;
  clubId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderAvatar: string;
  message: string;
  timestamp: string;
  taggedEventTitle?: string;
}

export interface ClubLeadTask {
  id: string;
  clubId: string;
  title: string;
  assignedToName: string;
  assignedToRole: string;
  assignedToAvatar: string;
  assignedByName: string;
  relatedEventTitle?: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
}

export interface EventBroadcastEmail {
  id: string;
  eventId: string;
  eventTitle: string;
  clubId: string;
  subject: string;
  message: string;
  recipientCount: number;
  category: 'venue_change' | 'time_update' | 'requirements' | 'general';
  sentBy: string;
  sentAt: string;
}

export type AcademicEventType =
  | 'Examination'
  | 'Practical Examination'
  | 'Project Submission'
  | 'Assignment Deadline'
  | 'Semester Start'
  | 'Semester End'
  | 'Holiday'
  | 'Academic Notice'
  | 'Other';

export type AcademicPriority = 'Normal' | 'Important' | 'Urgent';
export type AcademicStatus = 'Draft' | 'Published';

export interface AcademicNotice {
  id: string;
  title: string;
  eventType: AcademicEventType;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  department: string;
  year: string;
  semester: string;
  venue: string;
  description: string;
  priority: AcademicPriority;
  status: AcademicStatus;
  addedToCalendar?: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemDepartment {
  id: string;
  code: string;
  name: string;
  hodName: string;
  intake: number;
  active: boolean;
}

export interface SystemSettings {
  academicYear: string;
  activeSemester: string;
  termStartDate: string;
  termEndDate: string;
  examPeriodStart: string;
  examPeriodEnd: string;
  departments: SystemDepartment[];
  notifications: {
    broadcastAcademicNotices: boolean;
    notifyOnReschedule: boolean;
    adminDailyDigest: boolean;
    studentReminderHours: number;
    emailAlertsEnabled: boolean;
  };
  permissions: {
    presidentCanInviteSubhead: boolean;
    subheadCanDraftOnly: boolean;
    allowExternalRegistrations: boolean;
    autoApproveClassroomVenues: boolean;
  };
  maintenanceMode: boolean;
  defaultMaxParticipants: number;
}
