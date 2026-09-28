import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export enum EventCategory {
  CLUB = 'CLUB',
  ACADEMIC = 'ACADEMIC'
}

export enum RegistrationMethod {
  CAMPUSCONNECT = 'CAMPUSCONNECT',
  EXTERNAL = 'EXTERNAL',
  NONE = 'NONE'
}

export enum EventStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  RESCHEDULED = 'RESCHEDULED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export interface IRescheduledHistory {
  oldDate?: Date;
  oldStartTime?: string;
  oldEndTime?: string;
  oldVenueId?: Types.ObjectId;
  newDate?: Date;
  newStartTime?: string;
  newEndTime?: string;
  newVenueId?: Types.ObjectId;
  reason?: string;
  changedBy?: Types.ObjectId;
  changedAt?: Date;
}

export interface IEvent extends Document {
  id: string;
  title: string;
  eventType: string;
  category: EventCategory;
  shortDescription: string;
  description: string;
  agenda: string;
  posterTheme: string;
  posterUrl: string;
  date: Date;
  startTime: string;
  endTime: string;
  venueId?: Types.ObjectId | null;
  clubId?: Types.ObjectId | null;
  proposedBy: Types.ObjectId;
  maxParticipants?: number | null;
  registrationRequired: boolean;
  registrationMethod: RegistrationMethod;
  externalRegistrationUrl: string;
  externalRegistrationQrUrl: string;
  registrationDeadline?: Date | null;
  eligibility: string;
  requiredMaterials: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  status: EventStatus;
  rejectionReason: string;
  changeComments: string;
  rescheduledHistory: IRescheduledHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const RescheduleSchema = new Schema<IRescheduledHistory>(
  {
    oldDate: { type: Date },
    oldStartTime: { type: String },
    oldEndTime: { type: String },
    oldVenueId: { type: Schema.Types.ObjectId, ref: 'Venue' },
    newDate: { type: Date },
    newStartTime: { type: String },
    newEndTime: { type: String },
    newVenueId: { type: Schema.Types.ObjectId, ref: 'Venue' },
    reason: { type: String },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const EventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true
    },
    eventType: {
      type: String,
      required: [true, 'Event type is required'],
      trim: true
    },
    category: {
      type: String,
      enum: {
        values: Object.values(EventCategory),
        message: '{VALUE} is not a valid event category'
      },
      required: [true, 'Event category is required']
    },
    shortDescription: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    agenda: {
      type: String,
      default: ''
    },
    posterTheme: {
      type: String,
      default: ''
    },
    posterUrl: {
      type: String,
      default: ''
    },
    date: {
      type: Date,
      required: [true, 'Event date is required']
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required']
    },
    endTime: {
      type: String,
      required: [true, 'End time is required']
    },
    venueId: {
      type: Schema.Types.ObjectId,
      ref: 'Venue',
      default: null
    },
    clubId: {
      type: Schema.Types.ObjectId,
      ref: 'Club',
      default: null
    },
    proposedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Proposed by user is required']
    },
    maxParticipants: {
      type: Number,
      default: null,
      min: [1, 'Maximum participants must be at least 1']
    },
    registrationRequired: {
      type: Boolean,
      default: false
    },
    registrationMethod: {
      type: String,
      enum: {
        values: Object.values(RegistrationMethod),
        message: '{VALUE} is not a valid registration method'
      },
      default: RegistrationMethod.CAMPUSCONNECT
    },
    externalRegistrationUrl: {
      type: String,
      default: ''
    },
    externalRegistrationQrUrl: {
      type: String,
      default: ''
    },
    registrationDeadline: {
      type: Date,
      default: null
    },
    eligibility: {
      type: String,
      default: ''
    },
    requiredMaterials: {
      type: String,
      default: ''
    },
    contactPerson: {
      type: String,
      default: ''
    },
    contactEmail: {
      type: String,
      default: ''
    },
    contactPhone: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: {
        values: Object.values(EventStatus),
        message: '{VALUE} is not a valid event status'
      },
      default: EventStatus.DRAFT
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    changeComments: {
      type: String,
      default: ''
    },
    rescheduledHistory: {
      type: [RescheduleSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

EventSchema.index({ venueId: 1, date: 1, startTime: 1, endTime: 1 });
EventSchema.index({ clubId: 1, status: 1 });
EventSchema.index({ category: 1, date: 1 });

EventSchema.set('toJSON', {
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const Event: Model<IEvent> = mongoose.model<IEvent>('Event', EventSchema);
