import mongoose, { Schema } from 'mongoose';
import { ITeamMember } from '../types';

const teamMemberSchema = new Schema<ITeamMember>({
  teamId: {
    type: String,
    required: true,
    ref: 'Team',
  },
  userId: {
    type: String,
    required: true,
    ref: 'User',
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'member', 'observer'],
    default: 'member',
  },
  addedDate: {
    type: Date,
    default: Date.now,
  },
});

// Indexes
teamMemberSchema.index({ teamId: 1, userId: 1 }, { unique: true });
teamMemberSchema.index({ userId: 1 });
teamMemberSchema.index({ teamId: 1 });

export const TeamMember = mongoose.model<ITeamMember>('TeamMember', teamMemberSchema);


