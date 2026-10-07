import mongoose, { Types } from 'mongoose';
import { Certificate, ICertificate } from '../models/Certificate.js';
import { EventRegistration, RegistrationAttendanceStatus } from '../models/EventRegistration.js';
import { Event } from '../models/Event.js';
import { Club } from '../models/Club.js';
import { User } from '../models/User.js';
import { sendNotification } from './notificationService.js';
import { NotificationType } from '../models/Notification.js';

/**
 * Generates a standard institutional certificate code
 */
export function generateCertificateCode(enrollment: string): string {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  const cleanEnroll = enrollment.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() || '2026';
  return `PICT-CERT-${year}-${cleanEnroll}-${rand}`;
}

/**
 * Automatically creates and issues an official participation certificate
 * for a verified attendee.
 */
export async function issueCertificateForAttendee(
  registrationId: string | Types.ObjectId
): Promise<ICertificate | null> {
  const registration = await EventRegistration.findById(registrationId);
  if (!registration) {
    return null;
  }

  // Must be verified attended
  if (registration.attendanceStatus !== RegistrationAttendanceStatus.ATTENDED) {
    return null;
  }

  // Check if certificate already exists
  const existing = await Certificate.findOne({ registrationId: registration._id });
  if (existing) {
    return existing;
  }

  const [event, user] = await Promise.all([
    Event.findById(registration.eventId),
    User.findById(registration.studentId)
  ]);

  if (!event || !user) {
    return null;
  }

  let clubName = 'College Department';
  if (event.clubId) {
    const club = await Club.findById(event.clubId);
    if (club) {
      clubName = club.name;
    }
  }

  const enrollment = user.enrollmentNumber || registration.studentEnrollment || '2026';
  const certificateNumber = generateCertificateCode(enrollment);

  const cert = new Certificate({
    registrationId: registration._id,
    eventId: event._id,
    studentId: user._id,
    studentName: user.name,
    enrollmentNumber: enrollment,
    eventTitle: event.title,
    clubName,
    eventDate: event.date,
    certificateNumber,
    certificateFileUrl: `/certificates/${certificateNumber}.pdf`,
    verificationUrl: `/verify-certificate?code=${certificateNumber}`,
    issueDate: new Date()
  });

  await cert.save();

  // Send congratulatory certificate notification to student
  await sendNotification({
    userId: user._id,
    title: 'Certificate Issued! 🎓',
    message: `Your verified participation certificate for "${event.title}" is ready! Certificate code: ${certificateNumber}`,
    type: NotificationType.CERTIFICATE,
    eventId: event._id
  });

  return cert;
}
