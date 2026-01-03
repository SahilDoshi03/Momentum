import { Request, Response } from 'express';
import { User, TeamMember, ProjectMember } from '../models';
import { AppError, asyncHandler } from '../middleware';

// Get all users (admin only)
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await User.find({ active: true })
    .select('-password')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: users,
  });
});

// Get user by ID
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await User.findById(id).select('-password');
  if (!user || !user.active) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: user,
  });
});

// Get current user with roles
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  // Get user's team roles
  const teamMembers = await TeamMember.find({ userId: user._id })
    .populate('teamId', 'name organizationId')
    .populate('organizationId', 'name');

  // Get user's project roles
  const projectMembers = await ProjectMember.find({ userId: user._id })
    .populate('projectId', 'name teamId')
    .populate('teamId', 'name organizationId');

  const userWithRoles = {
    ...user.toJSON(),
    teamRoles: teamMembers.map(tm => ({
      teamId: (tm.teamId as any)._id,
      role: tm.role,
      team: tm.teamId,
    })),
    projectRoles: projectMembers.map(pm => ({
      projectId: (pm.projectId as any)._id,
      role: pm.role,
      project: pm.projectId,
    })),
  };

  res.json({
    success: true,
    data: userWithRoles,
  });
});

// Update user profile
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser = (req as any).user;
  const updates = req.body;

  // Users can only update their own profile unless they're admin
  if (id !== currentUser._id.toString() && !['admin', 'owner'].includes(currentUser.role)) {
    throw new AppError('Not authorized to update this user', 403);
  }

  const user = await User.findById(id);
  if (!user || !user.active) {
    throw new AppError('User not found', 404);
  }

  // Update allowed fields
  const allowedFields = ['fullName', 'bio', 'profileIcon'];
  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      (user as any)[field] = updates[field];
    }
  });

  // Update initials if fullName changed
  if (updates.fullName) {
    user.initials = user.generateInitials();
    if (!user.profileIcon) {
      user.profileIcon = {
        initials: user.initials,
        bgColor: '#000000', // Default fallback
      };
    } else {
      user.profileIcon.initials = user.initials;
    }
  }

  await user.save();

  res.json({
    success: true,
    message: 'User updated successfully',
    data: user.toJSON(),
  });
});

// Delete user (admin or self)
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser = (req as any).user;

  // Users can only delete their own account unless they're admin
  if (id !== currentUser._id.toString() && !['admin', 'owner'].includes(currentUser.role)) {
    throw new AppError('Not authorized to delete this user', 403);
  }

  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Soft delete - set active to false
  user.active = false;
  await user.save();

  res.json({
    success: true,
    message: 'User deleted successfully',
  });
});

// Get user's teams
export const getUserTeams = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser = (req as any).user;

  // Users can only view their own teams unless they're admin
  if (id !== currentUser._id.toString() && !['admin', 'owner'].includes(currentUser.role)) {
    throw new AppError('Not authorized to view this user\'s teams', 403);
  }

  const teamMembers = await TeamMember.find({ userId: id })
    .populate({
      path: 'teamId',
      select: 'name organizationId createdAt',
      populate: {
        path: 'organizationId',
        select: 'name',
      },
    })
    .sort({ addedDate: -1 });

  res.json({
    success: true,
    data: teamMembers,
  });
});

// Get user's projects
export const getUserProjects = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser = (req as any).user;

  // Users can only view their own projects unless they're admin
  if (id !== currentUser._id.toString() && !['admin', 'owner'].includes(currentUser.role)) {
    throw new AppError('Not authorized to view this user\'s projects', 403);
  }

  const projectMembers = await ProjectMember.find({ userId: id })
    .populate({
      path: 'projectId',
      select: 'name teamId createdAt',
      populate: {
        path: 'teamId',
        select: 'name organizationId',
        populate: {
          path: 'organizationId',
          select: 'name',
        },
      },
    })
    .sort({ addedAt: -1 });

  res.json({
    success: true,
    data: projectMembers,
  });
});

// Search users
export const searchUsers = asyncHandler(async (req: Request, res: Response) => {
  const { query } = req.query;
  const currentUser = (req as any).user;

  if (!query || typeof query !== 'string') {
    res.json({
      success: true,
      data: [],
    });
    return;
  }

  // Search by name or email, excluding current user
  const users = await User.find({
    $and: [
      { _id: { $ne: currentUser._id } },
      { active: true },
      {
        $or: [
          { fullName: { $regex: query, $options: 'i' } },
          { username: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
        ],
      },
    ],
  })
    .select('username fullName email initials profileIcon')
    .limit(10);

  res.json({
    success: true,
    data: users,
  });
});
