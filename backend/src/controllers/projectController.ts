import { Request, Response } from 'express';
import { Project, ProjectMember, TaskGroup, Task, ProjectLabel, LabelColor } from '../models';
import { AppError, asyncHandler } from '../middleware';

// Get all projects for user
export const getProjects = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { teamId } = req.query;

  let query: any = {};
  if (teamId) {
    query.teamId = teamId;
  }

  // Get projects where user is a member
  const projectMembers = await ProjectMember.find({ userId: user._id })
    .populate({
      path: 'projectId',
      match: query,
      populate: [
        { path: 'teamId', select: 'name organizationId' },
        { path: 'labels', populate: { path: 'labelColorId', select: 'name colorHex' } }
      ]
    });

  const projects = projectMembers
    .map(pm => pm.projectId)
    .filter(project => project !== null);

  res.json({
    success: true,
    data: projects,
  });
});

// Get project by ID with full details
export const getProjectById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;

  // Check if user is a member of this project
  const projectMember = await ProjectMember.findOne({ 
    projectId: id, 
    userId: user._id 
  });

  if (!projectMember) {
    throw new AppError('Not authorized to view this project', 403);
  }

  const project = await Project.findById(id)
    .populate('teamId', 'name organizationId')
    .populate({
      path: 'members',
      populate: { path: 'userId', select: 'username fullName initials email profileIcon' }
    })
    .populate({
      path: 'taskGroups',
      populate: {
        path: 'tasks',
        populate: [
          { path: 'assigned', populate: { path: 'userId', select: 'username fullName initials profileIcon' } },
          { path: 'labels', populate: { path: 'projectLabelId', populate: { path: 'labelColorId' } } }
        ]
      }
    })
    .populate({
      path: 'labels',
      populate: { path: 'labelColorId', select: 'name colorHex' }
    });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  res.json({
    success: true,
    data: project,
  });
});

// Create project
export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { name, teamId, shortId } = req.body;

  const project = new Project({
    name,
    teamId: teamId || null,
    shortId,
  });

  await project.save();

  // Add creator as project member with owner role
  const projectMember = new ProjectMember({
    projectId: project._id,
    userId: user._id,
    role: 'owner',
  });

  await projectMember.save();

  // Create default task groups
  const defaultGroups = [
    { name: 'To Do', position: 0 },
    { name: 'In Progress', position: 1 },
    { name: 'Done', position: 2 },
  ];

  for (const group of defaultGroups) {
    const taskGroup = new TaskGroup({
      projectId: project._id,
      name: group.name,
      position: group.position,
    });
    await taskGroup.save();
  }

  // Populate the response
  const populatedProject = await Project.findById(project._id)
    .populate('teamId', 'name organizationId')
    .populate({
      path: 'members',
      populate: { path: 'userId', select: 'username fullName initials email profileIcon' }
    })
    .populate('taskGroups');

  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    data: populatedProject,
  });
});

// Update project
export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;
  const updates = req.body;

  // Check if user is a member of this project
  const projectMember = await ProjectMember.findOne({ 
    projectId: id, 
    userId: user._id 
  });

  if (!projectMember || !['owner', 'admin'].includes(projectMember.role)) {
    throw new AppError('Not authorized to update this project', 403);
  }

  const project = await Project.findById(id);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  // Update allowed fields
  const allowedFields = ['name', 'publicOn'];
  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      project[field] = updates[field];
    }
  });

  await project.save();

  res.json({
    success: true,
    message: 'Project updated successfully',
    data: project,
  });
});

// Delete project
export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;

  // Check if user is owner of this project
  const projectMember = await ProjectMember.findOne({ 
    projectId: id, 
    userId: user._id,
    role: 'owner'
  });

  if (!projectMember) {
    throw new AppError('Not authorized to delete this project', 403);
  }

  // Delete all related data
  await TaskGroup.deleteMany({ projectId: id });
  await ProjectMember.deleteMany({ projectId: id });
  await ProjectLabel.deleteMany({ projectId: id });
  await Project.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Project deleted successfully',
  });
});

// Add project member
export const addProjectMember = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId, role = 'member' } = req.body;
  const currentUser = (req as any).user;

  // Check if current user can add members
  const currentUserMember = await ProjectMember.findOne({ 
    projectId: id, 
    userId: currentUser._id 
  });

  if (!currentUserMember || !['owner', 'admin'].includes(currentUserMember.role)) {
    throw new AppError('Not authorized to add members to this project', 403);
  }

  // Check if user is already a member
  const existingMember = await ProjectMember.findOne({ 
    projectId: id, 
    userId 
  });

  if (existingMember) {
    throw new AppError('User is already a member of this project', 400);
  }

  const projectMember = new ProjectMember({
    projectId: id,
    userId,
    role,
  });

  await projectMember.save();

  res.status(201).json({
    success: true,
    message: 'Member added to project successfully',
    data: projectMember,
  });
});

// Remove project member
export const removeProjectMember = asyncHandler(async (req: Request, res: Response) => {
  const { id, userId } = req.params;
  const currentUser = (req as any).user;

  // Check if current user can remove members
  const currentUserMember = await ProjectMember.findOne({ 
    projectId: id, 
    userId: currentUser._id 
  });

  if (!currentUserMember || !['owner', 'admin'].includes(currentUserMember.role)) {
    throw new AppError('Not authorized to remove members from this project', 403);
  }

  // Cannot remove the owner
  const memberToRemove = await ProjectMember.findOne({ 
    projectId: id, 
    userId,
    role: 'owner'
  });

  if (memberToRemove) {
    throw new AppError('Cannot remove project owner', 400);
  }

  await ProjectMember.findOneAndDelete({ projectId: id, userId });

  res.json({
    success: true,
    message: 'Member removed from project successfully',
  });
});

// Get project labels
export const getProjectLabels = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;

  // Check if user is a member of this project
  const projectMember = await ProjectMember.findOne({ 
    projectId: id, 
    userId: user._id 
  });

  if (!projectMember) {
    throw new AppError('Not authorized to view this project', 403);
  }

  const labels = await ProjectLabel.find({ projectId: id })
    .populate('labelColorId', 'name colorHex');

  res.json({
    success: true,
    data: labels,
  });
});

// Create project label
export const createProjectLabel = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, labelColorId } = req.body;
  const user = (req as any).user;

  // Check if user is a member of this project
  const projectMember = await ProjectMember.findOne({ 
    projectId: id, 
    userId: user._id 
  });

  if (!projectMember || !['owner', 'admin', 'member'].includes(projectMember.role)) {
    throw new AppError('Not authorized to create labels for this project', 403);
  }

  const label = new ProjectLabel({
    projectId: id,
    name,
    labelColorId,
  });

  await label.save();

  const populatedLabel = await ProjectLabel.findById(label._id)
    .populate('labelColorId', 'name colorHex');

  res.status(201).json({
    success: true,
    message: 'Label created successfully',
    data: populatedLabel,
  });
});

// Update project label
export const updateProjectLabel = asyncHandler(async (req: Request, res: Response) => {
  const { id, labelId } = req.params;
  const { name, labelColorId } = req.body;
  const user = (req as any).user;

  // Check if user is a member of this project
  const projectMember = await ProjectMember.findOne({ 
    projectId: id, 
    userId: user._id 
  });

  if (!projectMember || !['owner', 'admin', 'member'].includes(projectMember.role)) {
    throw new AppError('Not authorized to update labels for this project', 403);
  }

  const label = await ProjectLabel.findOneAndUpdate(
    { _id: labelId, projectId: id },
    { name, labelColorId },
    { new: true }
  ).populate('labelColorId', 'name colorHex');

  if (!label) {
    throw new AppError('Label not found', 404);
  }

  res.json({
    success: true,
    message: 'Label updated successfully',
    data: label,
  });
});

// Delete project label
export const deleteProjectLabel = asyncHandler(async (req: Request, res: Response) => {
  const { id, labelId } = req.params;
  const user = (req as any).user;

  // Check if user is a member of this project
  const projectMember = await ProjectMember.findOne({ 
    projectId: id, 
    userId: user._id 
  });

  if (!projectMember || !['owner', 'admin', 'member'].includes(projectMember.role)) {
    throw new AppError('Not authorized to delete labels for this project', 403);
  }

  const label = await ProjectLabel.findOneAndDelete({ _id: labelId, projectId: id });

  if (!label) {
    throw new AppError('Label not found', 404);
  }

  res.json({
    success: true,
    message: 'Label deleted successfully',
  });
});
