import {
  Club,
  Venue,
  User,
  CampusEvent,
  Registration,
  AppNotification,
  Certificate,
  EventFeedback,
  ClubLeadMessage,
  ClubLeadTask,
  AcademicNotice,
  SystemSettings
} from '../types';

export const INITIAL_USERS: User[] = [
  // Students
  {
    id: 'user_stud_1',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@pict.edu',
    enrollmentNumber: 'C2K2310142',
    role: 'student',
    department: 'Computer Engineering',
    year: 'TE (3rd Year)',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    followedClubs: ['club_acm', 'club_ieee', 'club_robotics'],
    phone: '+91 98234 11209',
    bio: 'Competitive programmer & full-stack enthusiast. IEEE & ACM student member.'
  },
  {
    id: 'user_stud_2',
    name: 'Ananya Patil',
    email: 'ananya.patil@pict.edu',
    enrollmentNumber: 'I2K2310087',
    role: 'student',
    department: 'Information Technology',
    year: 'SE (2nd Year)',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    followedClubs: ['club_ieee', 'club_pictorial', 'club_ecell'],
    phone: '+91 97654 88312',
    bio: 'UI/UX Designer and Hackathon builder. Exploring Generative AI & IoT.'
  },
  {
    id: 'user_stud_3',
    name: 'Vikram Deshmukh',
    email: 'vikram.d@pict.edu',
    enrollmentNumber: 'E2K2210045',
    role: 'student',
    department: 'Electronics & Telecommunication',
    year: 'BE (4th Year)',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    followedClubs: ['club_robotics', 'club_coding'],
    phone: '+91 99123 45678',
    bio: 'Robotics lead & Embedded Systems geek.'
  },

  // Club Presidents
  {
    id: 'user_pres_ieee',
    name: 'Aditya Kulkarni',
    email: 'ieee.president@pict.edu',
    enrollmentNumber: 'C2K2210012',
    role: 'president',
    department: 'Computer Engineering',
    year: 'BE (4th Year)',
    clubId: 'club_ieee',
    clubName: 'IEEE Student Branch',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    followedClubs: ['club_ieee', 'club_acm'],
    phone: '+91 98811 22334',
    bio: 'Chairperson, IEEE PICT Student Branch 2026-2027.'
  },
  {
    id: 'user_pres_acm',
    name: 'Tanvi Joshi',
    email: 'acm.president@pict.edu',
    enrollmentNumber: 'I2K2210034',
    role: 'president',
    department: 'Information Technology',
    year: 'BE (4th Year)',
    clubId: 'club_acm',
    clubName: 'ACM Student Chapter',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    followedClubs: ['club_acm'],
    phone: '+91 94220 55667',
    bio: 'Lead organizer for Pulzion & ACM SIG sessions.'
  },

  // Club Subheads / Admins
  {
    id: 'user_sub_ieee',
    name: 'Priya Mehta',
    email: 'priya.techsub@pict.edu',
    enrollmentNumber: 'C2K2310199',
    role: 'subhead',
    department: 'Computer Engineering',
    year: 'TE (3rd Year)',
    clubId: 'club_ieee',
    clubName: 'IEEE Student Branch',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    followedClubs: ['club_ieee'],
    phone: '+91 98223 99881',
    bio: 'Technical Head, IEEE Web & Cloud Computing SIG.'
  },
  {
    id: 'user_sub_acm',
    name: 'Rohan Nambiar',
    email: 'rohan.acm@pict.edu',
    enrollmentNumber: 'C2K2310056',
    role: 'subhead',
    department: 'Computer Engineering',
    year: 'TE (3rd Year)',
    clubId: 'club_acm',
    clubName: 'ACM Student Chapter',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    followedClubs: ['club_acm'],
    phone: '+91 98112 33445',
    bio: 'Event Coordinator, ACM Competitive Coding Circle.'
  },

  // College Admin
  {
    id: 'user_admin',
    name: 'Dr. S. K. Kulkarni',
    email: 'dean.studentaffairs@pict.edu',
    enrollmentNumber: 'PICT-ADM-108',
    role: 'college_admin',
    department: 'Dean Student Affairs & Academic Council',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    followedClubs: [],
    phone: '+91 020 2437 1101',
    bio: 'Dean Student Affairs & Institutional Calendar In-charge.'
  }
];

export const INITIAL_VENUES: Venue[] = [
  {
    id: 'venue_auditorium',
    name: 'Main Auditorium (A-Block)',
    building: 'Dr. APJ Abdul Kalam Block',
    floor: 'Ground Floor',
    capacity: 800,
    facilities: ['Dual 4K Projectors', 'Central Air Conditioning', 'Dolby Surround PA', 'Podium Mics', 'Stage Lighting', 'Live Streaming Setup'],
    isAvailable: true
  },
  {
    id: 'venue_seminar_hall',
    name: 'Central Seminar Hall (F-Block)',
    building: 'Information Tech Wing (F-Block)',
    floor: '2nd Floor',
    capacity: 300,
    facilities: ['HD Laser Projector', 'Air Conditioned', 'Wireless Mics', 'Acoustic Soundproofing', 'Video Conferencing Unit'],
    isAvailable: true
  },
  {
    id: 'venue_comp_lab_1',
    name: 'Advanced Computing Lab 1',
    building: 'Computer Dept Building',
    floor: '3rd Floor',
    capacity: 90,
    facilities: ['90 i7 Workstations', 'High-Speed LAN / Wi-Fi 6', 'Overhead Projector', 'AC', 'Dual Monitors on Instructor Desk'],
    isAvailable: true
  },
  {
    id: 'venue_comp_lab_2',
    name: 'AI & Data Science Lab 2',
    building: 'Computer Dept Building',
    floor: '4th Floor',
    capacity: 80,
    facilities: ['80 RTX 4080 GPU Nodes', 'High Speed Dedicated Internet', 'Smart Interactive Whiteboard', 'AC'],
    isAvailable: true
  },
  {
    id: 'venue_room_301',
    name: 'Smart Classroom 301',
    building: 'Main Academic Wing',
    floor: '3rd Floor',
    capacity: 120,
    facilities: ['Interactive Smart Board', 'Ceiling Mic System', 'Tiered Amphitheater Seating', 'AC'],
    isAvailable: true
  },
  {
    id: 'venue_room_302',
    name: 'Lecture Hall 302',
    building: 'Main Academic Wing',
    floor: '3rd Floor',
    capacity: 120,
    facilities: ['Short-throw Projector', 'Audio Amplifier', 'Whiteboards', 'AC'],
    isAvailable: true
  },
  {
    id: 'venue_open_ground',
    name: 'College Open Amphitheatre & Ground',
    building: 'Campus Central Quadrangle',
    floor: 'Open Air',
    capacity: 2500,
    facilities: ['Large Open Stage', 'Floodlights', 'Outdoor Heavy Sound System', 'Power Generators'],
    isAvailable: true
  }
];

export const INITIAL_CLUBS: Club[] = [
  {
    id: 'club_ieee',
    name: 'IEEE Student Branch',
    shortName: 'IEEE PICT',
    description: 'Premier technical organization advancing technology for humanity. Hosts annual national hackathons, technical paper presentations, IoT workshops, and industrial webinars.',
    logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=900&auto=format&fit=crop&q=80',
    department: 'Computer Engineering & ENTC',
    facultyCoordinator: 'Dr. G. V. Kale (Professor)',
    presidentId: 'user_pres_ieee',
    presidentName: 'Aditya Kulkarni',
    presidentEmail: 'ieee.president@pict.edu',
    subheadIds: ['user_sub_ieee'],
    memberCount: 480,
    contactEmail: 'ieee@pict.edu',
    socialLinks: {
      instagram: 'https://instagram.com/ieee_pict',
      linkedin: 'https://linkedin.com/company/ieee-pict',
      website: 'https://ieee.pict.edu',
      github: 'https://github.com/ieee-pict'
    },
    status: 'active',
    category: 'technical'
  },
  {
    id: 'club_acm',
    name: 'ACM Student Chapter',
    shortName: 'ACM PICT',
    description: 'Dedicated to computing machinery, data structures, algorithms, and cutting-edge software development. Flagship annual techno-cultural symposium Pulzion.',
    logo: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=120&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=900&auto=format&fit=crop&q=80',
    department: 'Information Technology',
    facultyCoordinator: 'Prof. S. R. Hiray',
    presidentId: 'user_pres_acm',
    presidentName: 'Tanvi Joshi',
    presidentEmail: 'acm.president@pict.edu',
    subheadIds: ['user_sub_acm'],
    memberCount: 520,
    contactEmail: 'acm@pict.edu',
    socialLinks: {
      instagram: 'https://instagram.com/acm_pict',
      linkedin: 'https://linkedin.com/company/acm-pict',
      website: 'https://acm.pict.edu'
    },
    status: 'active',
    category: 'technical'
  },
  {
    id: 'club_pictorial',
    name: 'Pictorial Club & Design Studio',
    shortName: 'Pictorial Club',
    description: 'The creative and media soul of college campus. Responsible for photography, short films, digital arts, visual branding, and annual college yearbook.',
    logo: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=120&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=900&auto=format&fit=crop&q=80',
    department: 'All Departments',
    facultyCoordinator: 'Prof. M. A. Joshi',
    presidentId: 'user_pres_pictorial',
    presidentName: 'Devansh Verma',
    presidentEmail: 'pictorial@pict.edu',
    subheadIds: [],
    memberCount: 210,
    contactEmail: 'pictorial@pict.edu',
    socialLinks: {
      instagram: 'https://instagram.com/pictorial_official'
    },
    status: 'active',
    category: 'cultural'
  },
  {
    id: 'club_robotics',
    name: 'Robotics & Automation Club',
    shortName: 'Robotics Club',
    description: 'Hardware, drone mechanics, autonomous rovers, and Robocon contestants. Hands-on fabrication, microcontrollers, ROS2, and 3D printing labs.',
    logo: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=120&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=900&auto=format&fit=crop&q=80',
    department: 'Electronics & Telecommunication',
    facultyCoordinator: 'Dr. S. B. Mane',
    presidentId: 'user_pres_robotics',
    presidentName: 'Siddharth Rao',
    presidentEmail: 'robotics@pict.edu',
    subheadIds: [],
    memberCount: 310,
    contactEmail: 'robotics@pict.edu',
    socialLinks: {
      instagram: 'https://instagram.com/robotics_pict'
    },
    status: 'active',
    category: 'technical'
  },
  {
    id: 'club_coding',
    name: 'Competitive Coding & Open Source Club',
    shortName: 'Coding Club',
    description: 'Fostering competitive programming, ICPC prep, GSoC mentoring, weekly algorithmic sprints, and open-source contributions.',
    logo: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=120&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=900&auto=format&fit=crop&q=80',
    department: 'Computer & IT',
    facultyCoordinator: 'Prof. Y. A. Patil',
    presidentId: 'user_pres_coding',
    presidentName: 'Kunal Singhal',
    presidentEmail: 'codingclub@pict.edu',
    subheadIds: [],
    memberCount: 440,
    contactEmail: 'codingclub@pict.edu',
    socialLinks: {
      github: 'https://github.com/pict-coding-club'
    },
    status: 'active',
    category: 'technical'
  },
  {
    id: 'club_ecell',
    name: 'Entrepreneurship & Innovation Cell (E-Cell)',
    shortName: 'E-Cell PICT',
    description: 'Incubating startup ideas, angel investment pitch decks, venture capital networking, and national business case competitions.',
    logo: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=120&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=900&auto=format&fit=crop&q=80',
    department: 'Management & Technology',
    facultyCoordinator: 'Dr. V. K. Pachghare',
    presidentId: 'user_pres_ecell',
    presidentName: 'Rhea Shah',
    presidentEmail: 'ecell@pict.edu',
    subheadIds: [],
    memberCount: 280,
    contactEmail: 'ecell@pict.edu',
    socialLinks: {
      linkedin: 'https://linkedin.com/company/ecell-pict'
    },
    status: 'active',
    category: 'entrepreneurship'
  }
];

export const DEFAULT_EVENT_IDS = new Set<string>([
  "evt_club_hello",
  "evt_club_diwali",
  "evt_club_quantum",
  "evt_club_ai_pending",
  "evt_club_esports_rejected",
  "evt_club_web3_completed",
  "evt_ieee_hackathon",
  "evt_acm_sig",
  "evt_robotics_ws",
  "evt_pictorial_art",
  "evt_ecell_summit",
  "evt_ieee_quantum_pending",
  "evt_acm_game_changes",
  "evt_ieee_web3_completed",
  "acad_insem_exams",
  "acad_project_deadline",
  "acad_ganesh_holiday",
  "acad_increscence_fest"
]);

export const DEFAULT_EVENT_TITLES = new Set<string>([
  "Hello — 24hr Campus Hackathon 2026",
  "Happy Diwali — Cultural & Innovation Gala",
  "Quantum Computing Hands-on Workshop with Qiskit",
  "Generative AI & LLM Systems Bootcamp",
  "Overnight Esports LAN Championship",
  "Solidity & Ethereum Smart Contracts Intensive",
  "HackGenesis 2026 — 24hr National Hackathon",
  "ACM DeepDive: Graph Neural Networks & PyTorch Geometric",
  "RoboQuest: ROS2 & LiDAR Navigation Hands-on Workshop",
  "FrameCraft: Cinematic Storytelling & Color Grading",
  "VentureForge 2026: Campus Angel Pitch & Incubation Demo Day",
  "Intro to Quantum Computing with Qiskit & IBM Quantum",
  "Algorithmic Game Theory & Nash Equilibrium Masterclass",
  "Mid-Semester Unit Test / In-Sem Examination",
  "BE Final Year Capstone Project Stage-1 Submission Deadline",
  "Anant Chaturdashi / National Holiday",
  "Increscence 2026 — Annual Inter-College Technical Symposium"
]);

export const DEFAULT_ACADEMIC_NOTICE_IDS = new Set<string>([
  "acad_insem_exams",
  "acad_practical_oral",
  "acad_project_milestone",
  "acad_assignment_dsa",
  "acad_diwali_holiday",
  "acad_term_conclusion",
  "acad_endsem_theory",
  "acad_draft_internship"
]);

export const INITIAL_EVENTS: CampusEvent[] = [];

export const INITIAL_REGISTRATIONS: Registration[] = [];

export const INITIAL_CLUB_MESSAGES: ClubLeadMessage[] = [];

export const INITIAL_CLUB_TASKS: ClubLeadTask[] = [];

export const INITIAL_CERTIFICATES: Certificate[] = [];

export const INITIAL_FEEDBACK: EventFeedback[] = [];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];

export const INITIAL_ACADEMIC_NOTICES: AcademicNotice[] = [];

export const INITIAL_SYSTEM_SETTINGS: SystemSettings = {
  academicYear: '2026-2027',
  activeSemester: 'Semester 1 (Odd Term) — July to December 2026',
  termStartDate: '2026-07-15',
  termEndDate: '2026-11-28',
  examPeriodStart: '2026-12-05',
  examPeriodEnd: '2026-12-24',
  departments: [
    { id: 'dept_comp', code: 'COMP', name: 'Computer Engineering', hodName: 'Dr. A. S. Ghotkar', intake: 240, active: true },
    { id: 'dept_it', code: 'IT', name: 'Information Technology', hodName: 'Dr. A. M. Bagade', intake: 180, active: true },
    { id: 'dept_entc', code: 'E&TC', name: 'Electronics & Telecommunication', hodName: 'Dr. M. P. Turuk', intake: 240, active: true },
    { id: 'dept_aids', code: 'AI&DS', name: 'Artificial Intelligence & Data Science', hodName: 'Dr. S. T. Gandhe', intake: 120, active: true },
    { id: 'dept_fe', code: 'FE', name: 'First Year Engineering & Applied Sciences', hodName: 'Dr. U. S. Joshi', intake: 780, active: true }
  ],
  notifications: {
    broadcastAcademicNotices: true,
    notifyOnReschedule: true,
    adminDailyDigest: true,
    studentReminderHours: 24,
    emailAlertsEnabled: true
  },
  permissions: {
    presidentCanInviteSubhead: true,
    subheadCanDraftOnly: true,
    allowExternalRegistrations: true,
    autoApproveClassroomVenues: false
  },
  maintenanceMode: false,
  defaultMaxParticipants: 150
};
