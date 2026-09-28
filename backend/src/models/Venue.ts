import mongoose, { Document, Schema, Model } from 'mongoose';

export enum VenueOperationalStatus {
  OPERATIONAL = 'OPERATIONAL',
  MAINTENANCE = 'MAINTENANCE',
  UNAVAILABLE = 'UNAVAILABLE'
}

export interface IVenue extends Document {
  id: string;
  name: string;
  building: string;
  floor: string;
  capacity: number;
  facilities: string[];
  isAvailable: boolean;
  operationalStatus: VenueOperationalStatus;
  createdAt: Date;
  updatedAt: Date;
}

const VenueSchema = new Schema<IVenue>(
  {
    name: {
      type: String,
      required: [true, 'Venue name is required'],
      unique: true,
      trim: true
    },
    building: {
      type: String,
      required: [true, 'Building name is required'],
      trim: true
    },
    floor: {
      type: String,
      default: ''
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1']
    },
    facilities: {
      type: [String],
      default: []
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    operationalStatus: {
      type: String,
      enum: {
        values: Object.values(VenueOperationalStatus),
        message: '{VALUE} is not a valid operational status'
      },
      default: VenueOperationalStatus.OPERATIONAL
    }
  },
  {
    timestamps: true
  }
);

VenueSchema.set('toJSON', {
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const Venue: Model<IVenue> = mongoose.model<IVenue>('Venue', VenueSchema);
