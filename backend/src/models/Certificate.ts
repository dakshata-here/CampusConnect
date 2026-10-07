import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface ICertificate extends Document {
  id: string;
  registrationId: Types.ObjectId;
  eventId: Types.ObjectId;
  studentId: Types.ObjectId;
  studentName: string;
  enrollmentNumber: string;
  studentEnrollment?: string;
  eventTitle: string;
  clubName: string;
  eventDate: Date;
  certificateNumber: string;
  certificateCode?: string;
  issueDate: Date;
  certificateFileUrl: string;
  verificationUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CertificateSchema = new Schema<ICertificate>(
  {
    registrationId: {
      type: Schema.Types.ObjectId,
      ref: 'EventRegistration',
      required: [true, 'Registration ID is required'],
      unique: true,
      index: true
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      index: true
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true
    },
    studentName: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true
    },
    enrollmentNumber: {
      type: String,
      required: [true, 'Student enrollment number is required'],
      trim: true,
      index: true
    },
    eventTitle: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true
    },
    clubName: {
      type: String,
      default: 'CampusConnect',
      trim: true
    },
    eventDate: {
      type: Date,
      required: [true, 'Event date is required'],
      default: Date.now
    },
    certificateNumber: {
      type: String,
      required: [true, 'Certificate number is required'],
      unique: true,
      trim: true,
      index: true
    },
    issueDate: {
      type: Date,
      default: Date.now
    },
    certificateFileUrl: {
      type: String,
      default: ''
    },
    verificationUrl: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

CertificateSchema.set('toJSON', {
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    // Map DTO aliases for frontend compatibility
    ret.certificateCode = ret.certificateNumber;
    ret.studentEnrollment = ret.enrollmentNumber;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const Certificate: Model<ICertificate> = mongoose.model<ICertificate>(
  'Certificate',
  CertificateSchema
);
