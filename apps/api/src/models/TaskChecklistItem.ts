import mongoose, { Schema } from 'mongoose';
import { ITaskChecklistItem } from '../types';

const taskChecklistItemSchema = new Schema<ITaskChecklistItem>({
  checklistId: {
    type: String,
    required: true,
    ref: 'TaskChecklist',
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  complete: {
    type: Boolean,
    default: false,
  },
  position: {
    type: Number,
    required: true,
    default: 0,
  },
  dueDate: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes
taskChecklistItemSchema.index({ checklistId: 1, position: 1 });
taskChecklistItemSchema.index({ checklistId: 1 });

export const TaskChecklistItem = mongoose.model<ITaskChecklistItem>('TaskChecklistItem', taskChecklistItemSchema);



