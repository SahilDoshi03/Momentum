import mongoose, { Schema } from 'mongoose';
import { IOrganization } from '../types';

const organizationSchema = new Schema<IOrganization>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
}, {
  timestamps: true,
});

// Indexes
organizationSchema.index({ name: 1 });

export const Organization = mongoose.model<IOrganization>('Organization', organizationSchema);



