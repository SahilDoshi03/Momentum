import mongoose, { Schema } from 'mongoose';
import { IProject } from '../types';

const projectSchema = new Schema<IProject>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  teamId: {
    type: String,
    ref: 'Team',
    default: null,
  },
  publicOn: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes
projectSchema.index({ teamId: 1 });
projectSchema.index({ name: 1 });

export const Project = mongoose.model<IProject>('Project', projectSchema);


