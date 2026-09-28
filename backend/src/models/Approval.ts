import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export enum ApprovalAction {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  OVERRIDDEN = 'OVERRIDDEN'
}

export interface IApproval extends Document {
  id: string;
  eventId: Types.ObjectId;
  reviewedBy: Types.ObjectId;
  action: ApprovalAction;
  comments: string;
  reviewedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ApprovalSchema = new Schema<IApproval>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      index: true
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewer User ID is required']
    },
    action: {
      type: String,
      enum: {
        values: Object.values(ApprovalAction),
        message: '{VALUE} is not a valid approval action'
      },
      required: [true, 'Approval action is required']
    },
    comments: {
      type: String,
      default: ''
    },
    reviewedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

ApprovalSchema.set('toJSON', {
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const Approval: Model<IApproval> = mongoose.model<IApproval>('Approval', ApprovalSchema);
