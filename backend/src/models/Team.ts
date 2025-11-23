import mongoose, { Schema } from 'mongoose';
import { ITeam } from '../types';

const teamSchema = new Schema<ITeam>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  organizationId: {
    type: String,
    required: true,
    ref: 'Organization',
  },
}, {
  timestamps: true,
});

// Indexes
teamSchema.index({ organizationId: 1 });
teamSchema.index({ name: 1 });

export const Team = mongoose.model<ITeam>('Team', teamSchema);



