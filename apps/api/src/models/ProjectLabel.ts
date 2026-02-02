import mongoose, { Schema } from 'mongoose';
import { IProjectLabel } from '../types';

const projectLabelSchema = new Schema<IProjectLabel>({
  projectId: {
    type: String,
    required: true,
    ref: 'Project',
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  labelColorId: {
    type: String,
    required: true,
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
});

// Indexes
projectLabelSchema.index({ projectId: 1 });
projectLabelSchema.index({ labelColorId: 1 });

export const ProjectLabel = mongoose.model<IProjectLabel>('ProjectLabel', projectLabelSchema);



