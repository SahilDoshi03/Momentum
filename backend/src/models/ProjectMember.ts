import mongoose, { Schema } from 'mongoose';
import { IProjectMember } from '../types';

const projectMemberSchema = new Schema<IProjectMember>({
  projectId: {
    type: String,
    required: true,
    ref: 'Project',
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
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes
projectMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true });
projectMemberSchema.index({ userId: 1 });
projectMemberSchema.index({ projectId: 1 });

export const ProjectMember = mongoose.model<IProjectMember>('ProjectMember', projectMemberSchema);


