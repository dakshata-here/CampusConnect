import mongoose, { Types } from 'mongoose';
import { Notification, NotificationType, INotification } from '../models/Notification.js';
import { UserRole } from '../models/User.js';

export interface CreateNotificationOptions {
  userId?: string | Types.ObjectId | null;
  targetRole?: UserRole | null;
  title: string;
  message: string;
  type?: NotificationType | string;
  eventId?: string | Types.ObjectId | null;
}

/**
 * Creates and persists an in-app notification
 */
export async function sendNotification(
  options: CreateNotificationOptions
): Promise<INotification> {
  const {
    userId,
    targetRole,
    title,
    message,
    type = NotificationType.INFO,
    eventId
  } = options;

  const notification = new Notification({
    userId: userId ? new mongoose.Types.ObjectId(userId.toString()) : null,
    targetRole: targetRole || null,
    title: title.trim(),
    message: message.trim(),
    type,
    eventId: eventId ? new mongoose.Types.ObjectId(eventId.toString()) : null,
    isRead: false
  });

  return await notification.save();
}

/**
 * Broadcasts an announcement to all users or a specific target role
 */
export async function broadcastNotice(
  title: string,
  message: string,
  targetRole?: UserRole,
  eventId?: string
): Promise<INotification> {
  return await sendNotification({
    title,
    message,
    targetRole: targetRole || null,
    type: NotificationType.INFO,
    eventId: eventId || null
  });
}
