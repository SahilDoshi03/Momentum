import mongoose, { Schema } from 'mongoose';
import { ITaskChecklist } from '../types';

const taskChecklistSchema = new Schema<ITaskChecklist>({
  taskId: {
    type: String,
    required: true,
    ref: 'Task',
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  position: {
    type: Number,
    required: true,
    default: 0,
  },
}, {
  timestamps: true,
});

// Indexes
taskChecklistSchema.index({ taskId: 1, position: 1 });
taskChecklistSchema.index({ taskId: 1 });

export const TaskChecklist = mongoose.model<ITaskChecklist>('TaskChecklist', taskChecklistSchema);


