import { Request, Response } from 'express';
import { TeamInvite, Team, TeamMember } from '../models';
import { AppError, asyncHandler } from '../middleware';
import { v4 as uuidv4 } from 'uuid';

// Create invite
export const createInvite = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const teamId = id;
    const { email } = req.body;
    const user = (req as any).user;

    if (!email) {
        throw new AppError('Email is required for invite', 400);
    }

    // Check if user is admin/owner of the team
    const teamMember = await TeamMember.findOne({
        teamId,
        userId: user._id.toString()
    });

    if (!teamMember || !['owner', 'admin'].includes(teamMember.role)) {
        throw new AppError('Not authorized to create invites for this team', 403);
    }

    // Check for existing active invite for this email
    const existingInvite = await TeamInvite.findOne({
        teamId,
        email: email.toLowerCase(),
        isActive: true,
        expiresAt: { $gt: new Date() }
    });

    if (existingInvite) {
        res.json({
            success: true,
            data: existingInvite,
        });
        return;
    }

    // Create new invite
    const invite = new TeamInvite({
        teamId,
        creatorId: user._id,
        email: email.toLowerCase(),
        token: uuidv4(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    await invite.save();

    res.status(201).json({
        success: true,
        data: invite,
    });
});

// Get invite details (public)
export const getInvite = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params;

    const invite = await TeamInvite.findOne({
        token,
        isActive: true,
        expiresAt: { $gt: new Date() }
    }).populate('teamId', 'name');

    if (!invite) {
        throw new AppError('Invalid or expired invite link', 404);
    }

    res.json({
        success: true,
        data: invite,
    });
});

// Accept invite
export const acceptInvite = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params;
    const user = (req as any).user;

    const invite = await TeamInvite.findOne({
        token,
        isActive: true,
        expiresAt: { $gt: new Date() }
    });

    if (!invite) {
        throw new AppError('Invalid or expired invite link', 404);
    }

    // Verify email matches
    if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
        throw new AppError('This invite is not for your email address', 403);
    }

    // Check if user is already a member
    const existingMember = await TeamMember.findOne({
        teamId: invite.teamId,
        userId: user._id.toString()
    });

    if (existingMember) {
        res.json({
            success: true,
            message: 'You are already a member of this team',
            data: { teamId: invite.teamId }
        });
        return;
    }

    // Add user to team
    const teamMember = new TeamMember({
        teamId: invite.teamId,
        userId: user._id.toString(),
        role: 'member',
    });

    await teamMember.save();

    // Deactivate invite after use
    invite.isActive = false;
    await invite.save();

    res.json({
        success: true,
        message: 'Successfully joined the team',
        data: { teamId: invite.teamId }
    });
});
