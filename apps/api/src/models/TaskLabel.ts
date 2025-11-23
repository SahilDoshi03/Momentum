import mongoose, { Schema } from 'mongoose';
import { ITaskLabel } from '../types';

const taskLabelSchema = new Schema<ITaskLabel>({
  taskId: {
    type: String,
    required: true,
    ref: 'Task',
  },
  projectLabelId: {
    type: String,
    required: true,
    ref: 'ProjectLabel',
  },
  assignedDate: {
    type: Date,
    default: Date.now,
  },
});

// Indexes
taskLabelSchema.index({ taskId: 1, projectLabelId: 1 }, { unique: true });
taskLabelSchema.index({ taskId: 1 });
taskLabelSchema.index({ projectLabelId: 1 });

export const TaskLabel = mongoose.model<ITaskLabel>('TaskLabel', taskLabelSchema);



