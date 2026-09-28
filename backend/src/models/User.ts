import mongoose, { Document, Schema, Model } from 'mongoose';
import { hashPassword, comparePassword } from '../utils/password.js';

export enum UserRole {
  COLLEGE_ADMIN = 'college_admin',
  CLUB_PRESIDENT = 'president',
  STUDENT = 'student'
}

export const ALLOWED_ROLES = [
  UserRole.COLLEGE_ADMIN,
  UserRole.CLUB_PRESIDENT,
  UserRole.STUDENT
] as const;

export type AllowedRole = (typeof ALLOWED_ROLES)[number];

export interface ISecurityQuestion {
  question: string;
  answer: string;
}

export interface IUser extends Document {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: AllowedRole;
  enrollmentNumber?: string;
  department: string;
  year?: string;
  clubId?: string;
  clubName?: string;
  avatar: string;
  followedClubs: string[];
  phone?: string;
  bio?: string;
  securityQuestions?: ISecurityQuestion[];
  status: 'active' | 'pending' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const SecurityQuestionSchema = new Schema<ISecurityQuestion>(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: ALLOWED_ROLES,
        message: '{VALUE} is not an allowed role. Allowed roles are: college_admin, president, student'
      }
    },
    enrollmentNumber: {
      type: String,
      trim: true,
      sparse: true,
      index: true
    },
    department: {
      type: String,
      trim: true,
      default: ''
    },
    year: {
      type: String,
      trim: true,
      default: ''
    },
    clubId: {
      type: String,
      trim: true
    },
    clubName: {
      type: String,
      trim: true
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
    },
    followedClubs: {
      type: [String],
      default: []
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    bio: {
      type: String,
      trim: true,
      default: ''
    },
    securityQuestions: {
      type: [SecurityQuestionSchema],
      default: undefined
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'rejected'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook to hash password if modified
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    this.password = await hashPassword(this.password);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  if (!this.password) {
    return false;
  }
  return comparePassword(candidate, this.password);
};

// Transform to clean JSON response (remove password, map _id to id)
UserSchema.set('toJSON', {
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    return ret;
  }
});

export const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
