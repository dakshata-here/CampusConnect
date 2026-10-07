import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export enum RegistrationAttendanceStatus {
  REGISTERED = 'REGISTERED',
  ATTENDED = 'ATTENDED',
  NOT_ATTENDED = 'NOT_ATTENDED'
}

export { RegistrationAttendanceStatus as AttendanceStatus };

export interface IEventRegistration extends Document {
  id: string;
  eventId: Types.ObjectId;
  studentId: Types.ObjectId;
  studentEnrollment: string;
  teamName: string;
  registrationDate: Date;
  attendanceStatus: RegistrationAttendanceStatus;
  attendedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const EventRegistrationSchema = new Schema<IEventRegistration>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      index: true
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student User ID is required'],
      index: true
    },
    studentEnrollment: {
      type: String,
      required: [true, 'Student enrollment number is required'],
      trim: true
    },
    teamName: {
      type: String,
      default: '',
      trim: true
    },
    registrationDate: {
      type: Date,
      default: Date.now
    },
    attendanceStatus: {
      type: String,
      enum: {
        values: Object.values(RegistrationAttendanceStatus),
        message: '{VALUE} is not a valid attendance status'
      },
      default: RegistrationAttendanceStatus.REGISTERED
    },
    attendedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

EventRegistrationSchema.index({ eventId: 1, studentId: 1 }, { unique: true });

EventRegistrationSchema.set('toJSON', {
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const EventRegistration: Model<IEventRegistration> = mongoose.model<IEventRegistration>(
  'EventRegistration',
  EventRegistrationSchema
);
