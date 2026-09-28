import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export enum ClubCategory {
  TECHNICAL = 'TECHNICAL',
  CULTURAL = 'CULTURAL',
  SPORTS = 'SPORTS',
  ENTREPRENEURSHIP = 'ENTREPRENEURSHIP',
  OTHER = 'OTHER'
}

export enum ClubStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export interface ISocialLinks {
  website?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  other?: string;
}

export interface IClub extends Document {
  id: string;
  name: string;
  shortName: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  departmentId?: Types.ObjectId | null;
  category: ClubCategory;
  status: ClubStatus;
  socialLinks?: ISocialLinks;
  createdAt: Date;
  updatedAt: Date;
}

const SocialLinksSchema = new Schema<ISocialLinks>(
  {
    website: { type: String, default: '' },
    instagram: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    youtube: { type: String, default: '' },
    other: { type: String, default: '' }
  },
  { _id: false }
);

const ClubSchema = new Schema<IClub>(
  {
    name: {
      type: String,
      required: [true, 'Club name is required'],
      unique: true,
      trim: true
    },
    shortName: {
      type: String,
      required: [true, 'Club short name is required'],
      unique: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    logoUrl: {
      type: String,
      default: ''
    },
    bannerUrl: {
      type: String,
      default: ''
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    category: {
      type: String,
      enum: {
        values: Object.values(ClubCategory),
        message: '{VALUE} is not a valid club category'
      },
      default: ClubCategory.OTHER
    },
    status: {
      type: String,
      enum: {
        values: Object.values(ClubStatus),
        message: '{VALUE} is not a valid club status'
      },
      default: ClubStatus.ACTIVE
    },
    socialLinks: {
      type: SocialLinksSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true
  }
);

ClubSchema.set('toJSON', {
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const Club: Model<IClub> = mongoose.model<IClub>('Club', ClubSchema);
