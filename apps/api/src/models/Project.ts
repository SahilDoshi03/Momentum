import mongoose, { Schema } from 'mongoose';
import { IProject } from '../types';

const projectSchema = new Schema<IProject>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  shortId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    maxlength: 10,
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
// shortId index is automatically created by unique: true
projectSchema.index({ name: 1 });

// Generate shortId before saving
projectSchema.pre('save', async function(next) {
  if (!this.isNew || this.shortId) return next();
  
  try {
    const count = await mongoose.model('Project').countDocuments();
    this.shortId = `P${String(count + 1).padStart(3, '0')}`;
    next();
  } catch (error) {
    next(error as Error);
  }
});

export const Project = mongoose.model<IProject>('Project', projectSchema);


