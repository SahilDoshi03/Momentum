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
  assigned: [{
    userId: {
      type: String,
      ref: 'User',
      required: true
    },
    assignedDate: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: String,
    ref: 'User',
    required: false
  },
  updatedBy: {
    type: String,
    ref: 'User',
    required: false
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate for labels
taskSchema.virtual('labels', {
  ref: 'TaskLabel',
  localField: '_id',
  foreignField: 'taskId',
});

// Indexes
taskSchema.index({ taskGroupId: 1, position: 1 });
// shortId index is automatically created by unique: true
taskSchema.index({ complete: 1 });

// Generate shortId before validation
// Generate shortId before validation
taskSchema.pre('validate', async function (next) {
  const doc = this as any;
  if (!doc.isNew || doc.shortId) return next();

  try {
    const count = await mongoose.model('Task').countDocuments();
    doc.shortId = String(count + 1);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Update completedAt when complete changes
taskSchema.pre('save', function (next) {
  if (this.isModified('complete')) {
    const doc = this as any;
    doc.completedAt = doc.complete ? new Date() : undefined;
  }
  next();
});

export const Task = mongoose.model<ITask>('Task', taskSchema);
