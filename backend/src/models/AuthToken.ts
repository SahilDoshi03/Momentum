import mongoose, { Schema } from 'mongoose';
import { IAuthToken } from '../types';

const authTokenSchema = new Schema<IAuthToken>({
  userId: {
    type: String,
    required: true,
    ref: 'User',
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes
authTokenSchema.index({ userId: 1 });
authTokenSchema.index({ token: 1 });
authTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

export const AuthToken = mongoose.model<IAuthToken>('AuthToken', authTokenSchema);


