import mongoose, { Schema } from 'mongoose';
import { IPersonalProject } from '../types';

const personalProjectSchema = new Schema<IPersonalProject>({
  userId: {
    type: String,
    required: true,
    ref: 'User',
  },
  projectId: {
    type: String,
    required: true,
    ref: 'Project',
  },
});

// Indexes
personalProjectSchema.index({ userId: 1, projectId: 1 }, { unique: true });
personalProjectSchema.index({ userId: 1 });
personalProjectSchema.index({ projectId: 1 });

export const PersonalProject = mongoose.model<IPersonalProject>('PersonalProject', personalProjectSchema);


