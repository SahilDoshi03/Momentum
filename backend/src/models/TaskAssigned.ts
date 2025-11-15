import mongoose, { Schema } from 'mongoose';
import { ITaskAssigned } from '../types';

const taskAssignedSchema = new Schema<ITaskAssigned>({
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
  assignedDate: {
    type: Date,
    default: Date.now,
  },
});

// Indexes
taskAssignedSchema.index({ taskId: 1, userId: 1 }, { unique: true });
taskAssignedSchema.index({ userId: 1 });
taskAssignedSchema.index({ taskId: 1 });

export const TaskAssigned = mongoose.model<ITaskAssigned>('TaskAssigned', taskAssignedSchema);


