import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import { UserRole, ALLOWED_ROLES } from './User.js';

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ALERT = 'alert',
  EVENT_UPDATE = 'event_update',
  CERTIFICATE = 'certificate',
  EVENT_APPROVAL = 'EVENT_APPROVAL',
  EVENT_CANCELLATION = 'EVENT_CANCELLATION',
  REGISTRATION = 'REGISTRATION',
  REMINDER = 'REMINDER',
  REQUEST_STATUS = 'REQUEST_STATUS',
  GENERAL = 'GENERAL'
}

export interface INotification extends Document {
  id: string;
  userId?: Types.ObjectId | null;
  targetRole?: UserRole | null;
  title: string;
  message: string;
  type: NotificationType | string;
  eventId?: Types.ObjectId | null;
  isRead: boolean;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    targetRole: {
      type: String,
      enum: {
        values: [...ALLOWED_ROLES, null],
        message: '{VALUE} is not a valid user role'
      },
      default: null,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true
    },
    type: {
      type: String,
      default: NotificationType.INFO
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      default: null
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

NotificationSchema.set('toJSON', {
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const Notification: Model<INotification> = mongoose.model<INotification>(
  'Notification',
  NotificationSchema
);
