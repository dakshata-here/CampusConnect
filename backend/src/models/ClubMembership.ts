import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export enum ClubMembershipRole {
  LEAD = 'LEAD',
  MEMBER = 'MEMBER'
}

export interface IClubMembership extends Document {
  id: string;
  clubId: Types.ObjectId;
  userId: Types.ObjectId;
  role: ClubMembershipRole;
  designation: string;
  joinedAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ClubMembershipSchema = new Schema<IClubMembership>(
  {
    clubId: {
      type: Schema.Types.ObjectId,
      ref: 'Club',
      required: [true, 'Club ID is required'],
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    role: {
      type: String,
      enum: {
        values: Object.values(ClubMembershipRole),
        message: '{VALUE} is not a valid club membership role'
      },
      default: ClubMembershipRole.MEMBER,
      required: [true, 'Membership role is required']
    },
    designation: {
      type: String,
      default: '',
      trim: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

ClubMembershipSchema.index({ clubId: 1, userId: 1 }, { unique: true });

ClubMembershipSchema.set('toJSON', {
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const ClubMembership: Model<IClubMembership> = mongoose.model<IClubMembership>(
  'ClubMembership',
  ClubMembershipSchema
);
