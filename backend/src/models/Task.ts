import mongoose, { Schema } from 'mongoose';
import { ITask } from '../types';

const taskSchema = new Schema<ITask>({
  taskGroupId: {
    type: String,
    required: true,
    ref: 'TaskGroup',
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  shortId: {
    type: String,
    required: true,
    unique: true,
    maxlength: 10,
  },
  description: {
    type: String,
    default: '',
    maxlength: 2000,
  },
  position: {
    type: Number,
    required: true,
    default: 0,
  },
  complete: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  dueDate: {
    type: Date,
    default: null,
  },
  hasTime: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes
taskSchema.index({ taskGroupId: 1, position: 1 });
taskSchema.index({ shortId: 1 });
taskSchema.index({ complete: 1 });

// Generate shortId before saving
taskSchema.pre('save', async function(next) {
  if (!this.isNew || this.shortId) return next();
  
  try {
    const count = await mongoose.model('Task').countDocuments();
    this.shortId = String(count + 1);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Update completedAt when complete changes
taskSchema.pre('save', function(next) {
  if (this.isModified('complete')) {
    this.completedAt = this.complete ? new Date() : undefined;
  }
  next();
});

export const Task = mongoose.model<ITask>('Task', taskSchema);
