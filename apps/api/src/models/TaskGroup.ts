import mongoose, { Schema } from 'mongoose';
import { ITaskGroup } from '../types';

const taskGroupSchema = new Schema<ITaskGroup>({
  projectId: {
    type: String,
    required: true,
    ref: 'Project',
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  position: {
    type: Number,
    required: true,
    default: 0,
  },
}, {
  timestamps: true,
});

// Virtual populate
taskGroupSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'taskGroupId',
});

// Ensure virtuals are included in JSON/Object output
taskGroupSchema.set('toObject', { virtuals: true });
taskGroupSchema.set('toJSON', { virtuals: true });

// Indexes
taskGroupSchema.index({ projectId: 1, position: 1 });
taskGroupSchema.index({ projectId: 1 });

export const TaskGroup = mongoose.model<ITaskGroup>('TaskGroup', taskGroupSchema);



