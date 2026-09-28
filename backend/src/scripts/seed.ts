import dotenv from 'dotenv';
dotenv.config();

import { connectDB, disconnectDB } from '../config/db.js';
import { User, UserRole } from '../models/User.js';

const DEMO_USERS = [
  {
    name: 'Dr. S. K. Kulkarni',
    email: 'admin@college.edu',
    password: 'Admin@123',
    role: UserRole.COLLEGE_ADMIN,
    enrollmentNumber: 'PICT-ADM-108',
    department: 'Dean Student Affairs & Academic Council',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    phone: '+91 020 2437 1101',
    bio: 'Dean Student Affairs & Institutional Calendar In-charge.',
    status: 'active' as const,
    securityQuestions: [
      { question: 'Which is your favourite book?', answer: 'Wings of Fire' },
      { question: 'Who is your role model?', answer: 'Dr. A. P. J. Abdul Kalam' },
      { question: 'Which is your favourite subject?', answer: 'Computer Networks & Security' },
      { question: 'What was the name of your first school?', answer: 'PICT Model School' },
      { question: 'What is your favourite research domain or hobby?', answer: 'Artificial Intelligence' }
    ]
  },
  {
    name: 'Aditya Kulkarni',
    email: 'president@college.edu',
    password: 'Admin@123',
    role: UserRole.CLUB_PRESIDENT,
    enrollmentNumber: 'C2K2210012',
    department: 'Computer Engineering',
    year: 'BE (4th Year)',
    clubId: 'CLUB001',
    clubName: 'IEEE Student Branch',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    followedClubs: ['CLUB001'],
    phone: '+91 98811 22334',
    bio: 'Chairperson, IEEE PICT Student Branch 2026-2027.',
    status: 'active' as const
  },
  {
    name: 'Rahul Sharma',
    email: 'student@college.edu',
    password: 'Admin@123',
    role: UserRole.STUDENT,
    enrollmentNumber: 'C2K2310142',
    department: 'Computer Engineering',
    year: 'TE (3rd Year)',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    followedClubs: ['CLUB001'],
    phone: '+91 98234 11209',
    bio: 'Competitive programmer & full-stack enthusiast.',
    status: 'active' as const
  }
];

export const seedDatabase = async (): Promise<void> => {
  try {
    await connectDB();
    console.log('[Seed] Seeding demo users...');

    for (const userData of DEMO_USERS) {
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        console.log(`[Seed] User already exists: ${userData.email}`);
      } else {
        const user = new User(userData);
        await user.save();
        console.log(`[Seed] Created ${userData.role} user: ${userData.email}`);
      }
    }

    console.log('[Seed] Seeding completed successfully.');
  } catch (error) {
    console.error('[Seed] Error during seeding:', error);
  } finally {
    await disconnectDB();
  }
};

// If executed directly
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  seedDatabase();
}
