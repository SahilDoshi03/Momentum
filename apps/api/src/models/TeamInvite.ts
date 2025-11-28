import mongoose, { Schema, Document } from 'mongoose';

export interface ITeamInvite extends Document {
    teamId: mongoose.Types.ObjectId;
    token: string;
    creatorId: mongoose.Types.ObjectId;
    email: string;
    expiresAt: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const teamInviteSchema = new Schema<ITeamInvite>({
    teamId: {
        type: Schema.Types.ObjectId,
        ref: 'Team',
        required: true,
    },
    token: {
        type: String,
        required: true,
        unique: true,
    },
    creatorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

// Index for faster lookups and automatic expiration (optional, but good practice)

teamInviteSchema.index({ teamId: 1 });

export const TeamInvite = mongoose.model<ITeamInvite>('TeamInvite', teamInviteSchema);
