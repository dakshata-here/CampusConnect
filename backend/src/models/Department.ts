import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IDepartment extends Document {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

DepartmentSchema.set('toJSON', {
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const Department: Model<IDepartment> = mongoose.model<IDepartment>(
  'Department',
  DepartmentSchema
);
