import { Request, Response } from 'express';
import { Team, TeamMember, Organization } from '../models';
import { AppError, asyncHandler } from '../middleware';

// Get all teams for user
export const getTeams = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  // Get teams where user is a member
  const teamMembers = await TeamMember.find({ userId: user._id.toString() })
    .populate({
      path: 'teamId',
      populate: {
        path: 'organizationId',
        select: 'name'
      }
    });

  const teams = teamMembers.map(tm => tm.teamId).filter(team => team !== null);

  res.json({
    success: true,
    data: teams,
  });
});

// Get team by ID
export const getTeamById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;

  // Check if user is a member of this team
  const teamMember = await TeamMember.findOne({
    teamId: id,
    userId: user._id
  });

  if (!teamMember) {
    throw new AppError('Not authorized to view this team', 403);
  }

  const team = await Team.findById(id)
    .populate('organizationId', 'name');

  if (!team) {
    throw new AppError('Team not found', 404);
  }

  res.json({
    success: true,
    data: team,
  });
});

// Create team
export const createTeam = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { name, organizationId } = req.body;

  if (!name || !name.trim()) {
    throw new AppError('Team name is required', 400);
  }

  let finalOrganizationId = organizationId;

  // If no organizationId provided, create a default organization for the user
  if (!finalOrganizationId) {
    const defaultOrg = new Organization({
      name: `${user.fullName}'s Organization`,
    });
    await defaultOrg.save();
    finalOrganizationId = defaultOrg._id;
  } else {
    // Verify organization exists
    const org = await Organization.findById(finalOrganizationId);
    if (!org) {
      throw new AppError('Organization not found', 404);
    }
  }

  const team = new Team({
    name: name.trim(),
    organizationId: finalOrganizationId,
  });

  await team.save();

  // Add creator as team member with owner role
  const teamMember = new TeamMember({
    teamId: team._id.toString(),
    userId: user._id.toString(),
    role: 'owner',
  });

  await teamMember.save();

  // Populate the response
  const populatedTeam = await Team.findById(team._id)
    .populate('organizationId', 'name');

  res.status(201).json({
    success: true,
    message: 'Team created successfully',
    data: populatedTeam,
  });
});

// Update team
export const updateTeam = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;
  const { name } = req.body;

  // Check if user is a member with admin/owner role
  const teamMember = await TeamMember.findOne({
    teamId: id,
    userId: user._id
  });

  if (!teamMember || !['owner', 'admin'].includes(teamMember.role)) {
    throw new AppError('Not authorized to update this team', 403);
  }

  const team = await Team.findById(id);

  if (!team) {
    throw new AppError('Team not found', 404);
  }

  if (name) {
    team.name = name.trim();
  }

  await team.save();

  const populatedTeam = await Team.findById(team._id)
    .populate('organizationId', 'name');

  res.json({
    success: true,
    message: 'Team updated successfully',
    data: populatedTeam,
  });
});

// Delete team
export const deleteTeam = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;

  // Check if user is owner
  const teamMember = await TeamMember.findOne({
    teamId: id,
    userId: user._id
  });

  if (!teamMember || teamMember.role !== 'owner') {
    throw new AppError('Only team owners can delete teams', 403);
  }

  const team = await Team.findById(id);

  if (!team) {
    throw new AppError('Team not found', 404);
  }

  // Delete all team members
  await TeamMember.deleteMany({ teamId: id });

  // Delete the team
  await Team.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Team deleted successfully',
  });
});

// Add team member
export const addTeamMember = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;
  const { userId, role = 'member' } = req.body;

  // Check if requester is admin or owner
  const requesterMember = await TeamMember.findOne({
    teamId: id,
    userId: user._id
  });

  if (!requesterMember || !['owner', 'admin'].includes(requesterMember.role)) {
    throw new AppError('Not authorized to add members to this team', 403);
  }

  // Check if user is already a member
  const existingMember = await TeamMember.findOne({
    teamId: id,
    userId
  });

  if (existingMember) {
    throw new AppError('User is already a member of this team', 400);
  }

  const teamMember = new TeamMember({
    teamId: id,
    userId: userId.toString(),
    role,
  });

  await teamMember.save();

  res.status(201).json({
    success: true,
    message: 'Team member added successfully',
    data: teamMember,
  });
});

// Remove team member
export const removeTeamMember = asyncHandler(async (req: Request, res: Response) => {
  const { id, userId } = req.params;
  const user = (req as any).user;

  // Check if requester is admin or owner
  const requesterMember = await TeamMember.findOne({
    teamId: id,
    userId: user._id
  });

  if (!requesterMember || !['owner', 'admin'].includes(requesterMember.role)) {
    throw new AppError('Not authorized to remove members from this team', 403);
  }

  // Prevent removing the last owner
  const targetMember = await TeamMember.findOne({
    teamId: id,
    userId
  });

  if (targetMember?.role === 'owner') {
    const ownerCount = await TeamMember.countDocuments({
      teamId: id,
      role: 'owner'
    });

    if (ownerCount <= 1) {
      throw new AppError('Cannot remove the last owner of the team', 400);
    }
  }

  await TeamMember.findOneAndDelete({
    teamId: id,
    userId
  });

  res.json({
    success: true,
    message: 'Team member removed successfully',
  });
});

// Get team members
export const getTeamMembers = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;

  // Check if user is a member of this team
  const teamMember = await TeamMember.findOne({
    teamId: id,
    userId: user._id
  });

  if (!teamMember) {
    throw new AppError('Not authorized to view members of this team', 403);
  }

  const members = await TeamMember.find({ teamId: id })
    .populate('userId', 'fullName email initials profileIcon');

  res.json({
    success: true,
    data: members,
  });
});

// Update team member role
export const updateTeamMember = asyncHandler(async (req: Request, res: Response) => {
  const { id, userId } = req.params;
  const { role } = req.body;
  const user = (req as any).user;

  if (!['owner', 'admin', 'member', 'observer'].includes(role)) {
    throw new AppError('Invalid role', 400);
  }

  // Check if requester is admin or owner
  const requesterMember = await TeamMember.findOne({
    teamId: id,
    userId: user._id
  });

  if (!requesterMember || !['owner', 'admin'].includes(requesterMember.role)) {
    throw new AppError('Not authorized to update member roles', 403);
  }

  const memberToUpdate = await TeamMember.findOne({
    teamId: id,
    userId
  });

  if (!memberToUpdate) {
    throw new AppError('Member not found', 404);
  }

  // Admins cannot change role of owner
  if (memberToUpdate.role === 'owner' && requesterMember.role !== 'owner') {
    throw new AppError('Only the owner can change owner role', 403);
  }

  // Prevent removing the last owner
  if (memberToUpdate.role === 'owner' && role !== 'owner') {
    const ownerCount = await TeamMember.countDocuments({
      teamId: id,
      role: 'owner'
    });

    if (ownerCount <= 1) {
      throw new AppError('Cannot demote the last owner of the team', 400);
    }
  }

  memberToUpdate.role = role;
  await memberToUpdate.save();

  res.json({
    success: true,
    message: 'Team member role updated successfully',
    data: memberToUpdate,
  });
});
