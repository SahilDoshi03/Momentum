import mongoose, { Schema } from 'mongoose';
import { ITaskComment } from '../types';

const taskCommentSchema = new Schema<ITaskComment>({
  taskId: {
    type: String,
    required: true,
    ref: 'Task',
  },
  userId: {
    type: String,
    required: true,
    ref: 'User',
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
  },
  pinned: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes
taskCommentSchema.index({ taskId: 1, createdAt: -1 });
taskCommentSchema.index({ userId: 1 });
taskCommentSchema.index({ pinned: 1 });

export const TaskComment = mongoose.model<ITaskComment>('TaskComment', taskCommentSchema);


