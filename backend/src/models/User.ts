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
  fullName?: string;
  email: string;
  password?: string;
  passwordHash?: string;
  role: AllowedRole;
  userType?: string;
  enrollmentNumber?: string;
  prn?: string;
  employeeId?: string;
  department: string;
  departmentId?: mongoose.Types.ObjectId | null;
  year?: string;
  semester?: string;
  clubId?: string;
  clubName?: string;
  avatar: string;
  profilePhotoUrl?: string;
  followedClubs: string[];
  phone?: string;
  bio?: string;
  securityQuestions?: ISecurityQuestion[];
  status: 'active' | 'pending' | 'rejected';
  isActive?: boolean;
  mustChangePassword?: boolean;
  passwordChangedAt?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  resetTokenUsed?: boolean;
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
      trim: true,
      default: function (this: any) {
        return this.fullName || '';
      }
    },
    fullName: {
      type: String,
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
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false
    },
    passwordHash: {
      type: String,
      select: false
    },
    role: {
      type: String,
      enum: {
        values: ALLOWED_ROLES,
        message: '{VALUE} is not an allowed role. Allowed roles are: college_admin, president, student'
      },
      default: function (this: any) {
        if (this.userType === 'ADMIN') return UserRole.COLLEGE_ADMIN;
        if (this.userType === 'STUDENT') return UserRole.STUDENT;
        return UserRole.STUDENT;
      }
    },
    userType: {
      type: String,
      trim: true
    },
    enrollmentNumber: {
      type: String,
      trim: true,
      sparse: true,
      index: true
    },
    prn: {
      type: String,
      trim: true,
      sparse: true,
      index: true
    },
    employeeId: {
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
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    year: {
      type: String,
      trim: true,
      default: ''
    },
    semester: {
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
    profilePhotoUrl: {
      type: String,
      trim: true
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
    },
    isActive: {
      type: Boolean,
      default: true
    },
    mustChangePassword: {
      type: Boolean,
      default: false
    },
    passwordChangedAt: {
      type: Date
    },
    resetPasswordToken: {
      type: String,
      select: false
    },
    resetPasswordExpires: {
      type: Date,
      select: false
    },
    resetTokenUsed: {
      type: Boolean,
      default: false,
      select: false
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook to hash password if modified
UserSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    if (this.password.startsWith('$2')) {
      this.passwordHash = this.password;
    } else {
      try {
        this.password = await hashPassword(this.password);
        this.passwordHash = this.password;
      } catch (error) {
        return next(error as Error);
      }
    }
  }

  // Synchronize name with fullName if either is missing
  if (!this.name && this.fullName) {
    this.name = this.fullName;
  } else if (!this.fullName && this.name) {
    this.fullName = this.name;
  }

  // Synchronize enrollmentNumber with prn/employeeId if missing
  if (!this.enrollmentNumber) {
    this.enrollmentNumber = this.prn || this.employeeId;
  }

  next();
});

// Instance method to compare password with bcrypt only
UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  const hash = this.password || this.passwordHash;
  if (!hash || typeof hash !== 'string' || !candidate) {
    return false;
  }

  // Strictly reject the legacy placeholder - never authenticate it
  if (hash === 'DEMO_HASH_REPLACE_BEFORE_AUTH_TESTING' || !hash.startsWith('$2')) {
    return false;
  }

  try {
    return await comparePassword(candidate, hash);
  } catch {
    return false;
  }
};

// Transform to clean JSON response (remove password, map _id to id)
UserSchema.set('toJSON', {
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    ret.name = ret.name || ret.fullName || '';
    ret.enrollmentNumber = ret.enrollmentNumber || ret.prn || ret.employeeId || '';
    if (!ret.role && ret.userType) {
      if (ret.userType === 'ADMIN') ret.role = UserRole.COLLEGE_ADMIN;
      else if (ret.userType === 'STUDENT') ret.role = UserRole.STUDENT;
    }
    ret.avatar = ret.avatar || ret.profilePhotoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
    ret.mustChangePassword = Boolean(ret.mustChangePassword);
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    delete ret.passwordHash;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    delete ret.resetTokenUsed;
    return ret;
  }
});

export const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
