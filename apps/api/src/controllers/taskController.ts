import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Task, TaskGroup, TaskLabel, ProjectMember, ProjectLabel } from '../models';
import { ITask } from '../types';
import { AppError, asyncHandler } from '../middleware';

// Get my tasks
export const getMyTasks = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { status = 'ALL', sort = 'NONE' } = req.query;

  // Get all tasks assigned to user
  let tasks = await Task.find({ 'assigned.userId': user._id })
    .populate('taskGroupId', 'name projectId')
    .populate({
      path: 'assigned',
      populate: { path: 'userId', select: 'fullName initials profileIcon' }
    })
    .populate({
      path: 'labels',
      populate: { path: 'projectLabelId', populate: { path: 'labelColorId' } }
    })
    .populate('createdBy', 'fullName initials profileIcon')
    .populate('updatedBy', 'fullName initials profileIcon') as unknown as ITask[];

  // Apply status filter
  if (status !== 'ALL') {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
    const threeWeeksAgo = new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000);

    switch (status) {
      case 'INCOMPLETE':
        tasks = tasks.filter(task => !task.complete);
        break;
      case 'COMPLETE_ALL':
        tasks = tasks.filter(task => task.complete);
        break;
      case 'COMPLETE_TODAY':
        tasks = tasks.filter(task =>
          task.complete &&
          task.completedAt &&
          task.completedAt >= today
        );
        break;
      case 'COMPLETE_YESTERDAY':
        tasks = tasks.filter(task =>
          task.complete &&
          task.completedAt &&
          task.completedAt >= yesterday &&
          task.completedAt < today
        );
        break;
      case 'COMPLETE_ONE_WEEK':
        tasks = tasks.filter(task =>
          task.complete &&
          task.completedAt &&
          task.completedAt >= oneWeekAgo
        );
        break;
      case 'COMPLETE_TWO_WEEK':
        tasks = tasks.filter(task =>
          task.complete &&
          task.completedAt &&
          task.completedAt >= twoWeeksAgo
        );
        break;
      case 'COMPLETE_THREE_WEEK':
        tasks = tasks.filter(task =>
          task.complete &&
          task.completedAt &&
          task.completedAt >= threeWeeksAgo
        );
        break;
    }
  }

  // Apply sorting
  switch (sort) {
    case 'PROJECT':
      // Note: projectId is a string, so we can't sort by project name without fetching projects
      // For now, sort by projectId string value
      tasks.sort((a, b) => {
        const projectIdA = (a.taskGroupId as any)?.projectId || '';
        const projectIdB = (b.taskGroupId as any)?.projectId || '';
        return projectIdA.localeCompare(projectIdB);
      });
      break;
    case 'DUE_DATE':
      tasks.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.getTime() - b.dueDate.getTime();
      });
      break;
    default:
      // Sort by creation date (newest first)
      tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Create project mapping
  const projectMapping = tasks.map(task => ({
    projectID: (task.taskGroupId as any)?.projectId || task.taskGroupId,
    taskID: task._id,
  }));

  res.json({
    success: true,
    data: {
      tasks,
      projects: projectMapping,
    },
  });
});

// Create task
export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { taskGroupId, name, description, dueDate, hasTime } = req.body;

  // Check if user has access to this task group's project
  // Handle both ObjectId and string formats - use ObjectId directly if it's already one
  let taskGroupIdQuery: any = taskGroupId;
  if (taskGroupId && typeof taskGroupId === 'object' && taskGroupId.constructor.name === 'ObjectId') {
    // Already an ObjectId, use it directly
    taskGroupIdQuery = taskGroupId;
  } else if (typeof taskGroupId === 'string' && mongoose.Types.ObjectId.isValid(taskGroupId)) {
    // Convert string to ObjectId
    taskGroupIdQuery = new mongoose.Types.ObjectId(taskGroupId);
  }
  const taskGroup = await TaskGroup.findById(taskGroupIdQuery);
  if (!taskGroup) {
    throw new AppError('Task group not found', 404);
  }

  const projectMember = await ProjectMember.findOne({
    projectId: taskGroup.projectId,
    userId: user._id
  });

  if (!projectMember) {
    throw new AppError('Not authorized to create tasks in this project', 403);
  }

  const task = new Task({
    taskGroupId,
    name,
    description,
    dueDate: dueDate ? new Date(dueDate) : null,
    hasTime: hasTime || false,
    createdBy: user._id,
    updatedBy: user._id,
  });

  await task.save();

  // Assign to creator if they have member role or higher
  if (['owner', 'admin', 'member'].includes(projectMember.role)) {
    task.assigned.push({
      userId: user._id,
      assignedDate: new Date(),
    } as any);
    await task.save();
  }

  const populatedTask = await Task.findById(task._id)
    .populate('taskGroupId', 'name projectId')
    .populate({
      path: 'assigned',
      populate: { path: 'userId', select: 'fullName initials profileIcon' }
    })
    .populate({
      path: 'labels',
      populate: { path: 'projectLabelId', populate: { path: 'labelColorId' } }
    })
    .populate('createdBy', 'fullName initials profileIcon')
    .populate('updatedBy', 'fullName initials profileIcon');

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: populatedTask,
  });
});

// Get task by ID
export const getTaskById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;

  // Handle both ObjectId and string formats
  let taskIdQuery: any = id;
  if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
    taskIdQuery = new mongoose.Types.ObjectId(id);
  }
  const task = await Task.findById(taskIdQuery)
    .populate('taskGroupId', 'name projectId')
    .populate({
      path: 'assigned',
      populate: { path: 'userId', select: 'fullName initials profileIcon' }
    })
    .populate({
      path: 'labels',
      populate: { path: 'projectLabelId', populate: { path: 'labelColorId' } }
    })
    .populate('createdBy', 'fullName initials profileIcon')
    .populate('updatedBy', 'fullName initials profileIcon');

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  // Get the task group to access projectId
  // Mongoose findById handles both ObjectId and string IDs
  const taskGroup = await TaskGroup.findById(task.taskGroupId);
  if (!taskGroup) {
    throw new AppError('Task group not found', 404);
  }

  // Check if user has access to this task's project
  const projectMember = await ProjectMember.findOne({
    projectId: taskGroup.projectId,
    userId: user._id
  });

  if (!projectMember) {
    throw new AppError('Not authorized to view this task', 403);
  }

  res.json({
    success: true,
    data: task,
  });
});

// Update task
export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;
  const updates = req.body;

  // Handle both ObjectId and string formats
  let taskIdQuery: any = id;
  if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
    taskIdQuery = new mongoose.Types.ObjectId(id);
  }
  const task = await Task.findById(taskIdQuery);
  if (!task) {
    throw new AppError('Task not found', 404);
  }

  // Get the task group to access projectId
  // Mongoose findById handles both ObjectId and string IDs
  const taskGroup = await TaskGroup.findById(task.taskGroupId);
  if (!taskGroup) {
    throw new AppError('Task group not found', 404);
  }

  // Check if user has access to this task's project
  const projectMember = await ProjectMember.findOne({
    projectId: taskGroup.projectId,
    userId: user._id
  });

  if (!projectMember) {
    throw new AppError('Not authorized to update this task', 403);
  }

  // Update allowed fields
  const allowedFields = ['name', 'description', 'dueDate', 'hasTime', 'complete', 'position', 'taskGroupId'];
  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      if (field === 'dueDate' && updates[field] !== null) {
        (task as any)[field] = new Date(updates[field]);
      } else {
        (task as any)[field] = updates[field];
      }
    }
  });

  // Update updatedBy field
  (task as any).updatedBy = user._id;

  await task.save();

  const populatedTask = await Task.findById(task._id)
    .populate('taskGroupId', 'name projectId')
    .populate({
      path: 'assigned',
      populate: { path: 'userId', select: 'fullName initials profileIcon' }
    })
    .populate({
      path: 'labels',
      populate: { path: 'projectLabelId', populate: { path: 'labelColorId' } }
    })
    .populate('createdBy', 'fullName initials profileIcon')
    .populate('updatedBy', 'fullName initials profileIcon');

  res.json({
    success: true,
    message: 'Task updated successfully',
    data: populatedTask,
  });
});

// Delete task
export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;

  // Handle both ObjectId and string formats
  let taskIdQuery: any = id;
  if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
    taskIdQuery = new mongoose.Types.ObjectId(id);
  }
  const task = await Task.findById(taskIdQuery);
  if (!task) {
    throw new AppError('Task not found', 404);
  }

  // Get the task group to access projectId
  // Mongoose findById handles both ObjectId and string IDs
  const taskGroup = await TaskGroup.findById(task.taskGroupId);
  if (!taskGroup) {
    throw new AppError('Task group not found', 404);
  }

  // Check if user has access to this task's project
  const projectMember = await ProjectMember.findOne({
    projectId: taskGroup.projectId,
    userId: user._id
  });

  if (!projectMember || !['owner', 'admin', 'member'].includes(projectMember.role)) {
    throw new AppError('Not authorized to delete this task', 403);
  }

  // Delete related data
  await TaskLabel.deleteMany({ taskId: id });
  await Task.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Task deleted successfully',
  });
});

// Assign user to task
export const assignUserToTask = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.body;
  const currentUser = (req as any).user;

  // Handle both ObjectId and string formats
  let taskIdQuery: any = id;
  if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
    taskIdQuery = new mongoose.Types.ObjectId(id);
  }
  const task = await Task.findById(taskIdQuery);
  if (!task) {
    throw new AppError('Task not found', 404);
  }

  // Get the task group to access projectId
  // Mongoose findById handles both ObjectId and string IDs
  const taskGroup = await TaskGroup.findById(task.taskGroupId);
  if (!taskGroup) {
    throw new AppError('Task group not found', 404);
  }

  // Check if current user has access to this task's project
  const projectMember = await ProjectMember.findOne({
    projectId: taskGroup.projectId,
    userId: currentUser._id
  });

  if (!projectMember || !['owner', 'admin', 'member'].includes(projectMember.role)) {
    throw new AppError('Not authorized to assign users to this task', 403);
  }

  // Check if user is already assigned
  const isAlreadyAssigned = task.assigned.some(a => (a.userId as any)._id?.toString() === userId || (a.userId as any).toString() === userId);
  if (isAlreadyAssigned) {
    throw new AppError('User is already assigned to this task', 400);
  }

  // Add to Task.assigned
  const newAssignment = {
    userId,
    assignedDate: new Date(),
  };

  task.assigned.push(newAssignment as any);
  await task.save();

  res.status(201).json({
    success: true,
    message: 'User assigned to task successfully',
    data: newAssignment,
  });
});

// Unassign user from task
export const unassignUserFromTask = asyncHandler(async (req: Request, res: Response) => {
  const { id, userId } = req.params;
  const currentUser = (req as any).user;

  // Handle both ObjectId and string formats
  let taskIdQuery: any = id;
  if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
    taskIdQuery = new mongoose.Types.ObjectId(id);
  }
  const task = await Task.findById(taskIdQuery);
  if (!task) {
    throw new AppError('Task not found', 404);
  }

  // Get the task group to access projectId
  // Mongoose findById handles both ObjectId and string IDs
  const taskGroup = await TaskGroup.findById(task.taskGroupId);
  if (!taskGroup) {
    throw new AppError('Task group not found', 404);
  }

  // Check if current user has access to this task's project
  const projectMember = await ProjectMember.findOne({
    projectId: taskGroup.projectId,
    userId: currentUser._id
  });

  if (!projectMember || !['owner', 'admin', 'member'].includes(projectMember.role)) {
    throw new AppError('Not authorized to unassign users from this task', 403);
  }

  // Remove from Task.assigned
  await Task.findByIdAndUpdate(id, {
    $pull: {
      assigned: {
        userId
      }
    }
  });

  res.json({
    success: true,
    message: 'User unassigned from task successfully',
  });
});

// Add label to task
export const addLabelToTask = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { projectLabelId } = req.body;
  const user = (req as any).user;

  // Handle both ObjectId and string formats
  let taskIdQuery: any = id;
  if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
    taskIdQuery = new mongoose.Types.ObjectId(id);
  }
  const task = await Task.findById(taskIdQuery);
  if (!task) {
    throw new AppError('Task not found', 404);
  }

  // Get the task group to access projectId
  // Mongoose findById handles both ObjectId and string IDs
  const taskGroup = await TaskGroup.findById(task.taskGroupId);
  if (!taskGroup) {
    throw new AppError('Task group not found', 404);
  }

  // Check if user has access to this task's project
  const projectMember = await ProjectMember.findOne({
    projectId: taskGroup.projectId,
    userId: user._id
  });

  if (!projectMember) {
    throw new AppError('Not authorized to modify this task', 403);
  }

  // Check if label belongs to the same project
  const projectLabel = await ProjectLabel.findById(projectLabelId);
  if (!projectLabel || projectLabel.projectId !== taskGroup.projectId) {
    throw new AppError('Label does not belong to this project', 400);
  }

  // Check if label is already assigned
  const existingLabel = await TaskLabel.findOne({ taskId: id, projectLabelId });
  if (existingLabel) {
    throw new AppError('Label is already assigned to this task', 400);
  }

  const taskLabel = new TaskLabel({
    taskId: id,
    projectLabelId,
  });

  await taskLabel.save();

  res.status(201).json({
    success: true,
    message: 'Label added to task successfully',
    data: taskLabel,
  });
});

// Remove label from task
export const removeLabelFromTask = asyncHandler(async (req: Request, res: Response) => {
  const { id, labelId } = req.params;
  const user = (req as any).user;

  // Handle both ObjectId and string formats
  let taskIdQuery: any = id;
  if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
    taskIdQuery = new mongoose.Types.ObjectId(id);
  }
  const task = await Task.findById(taskIdQuery);
  if (!task) {
    throw new AppError('Task not found', 404);
  }

  // Get the task group to access projectId
  // Mongoose findById handles both ObjectId and string IDs
  const taskGroup = await TaskGroup.findById(task.taskGroupId);
  if (!taskGroup) {
    throw new AppError('Task group not found', 404);
  }

  // Check if user has access to this task's project
  const projectMember = await ProjectMember.findOne({
    projectId: taskGroup.projectId,
    userId: user._id
  });

  if (!projectMember) {
    throw new AppError('Not authorized to modify this task', 403);
  }

  await TaskLabel.findOneAndDelete({ taskId: id, projectLabelId: labelId });

  res.json({
    success: true,
    message: 'Label removed from task successfully',
  });
});

// Create task group
export const createTaskGroup = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { projectId, name, position } = req.body;

  // Check if user has access to the project
  const projectMember = await ProjectMember.findOne({
    projectId,
    userId: user._id
  });

  if (!projectMember) {
    throw new AppError('Not authorized to create task groups in this project', 403);
  }

  // If position is not provided, put it at the end
  let groupPosition = position;
  if (groupPosition === undefined) {
    const lastGroup = await TaskGroup.findOne({ projectId }).sort({ position: -1 });
    groupPosition = lastGroup ? lastGroup.position + 1 : 0;
  }

  const taskGroup = new TaskGroup({
    projectId,
    name,
    position: groupPosition,
  });

  await taskGroup.save();

  res.status(201).json({
    success: true,
    message: 'Task group created successfully',
    data: {
      ...taskGroup.toObject(),
      tasks: []
    },
  });
});

// Update task group
export const updateTaskGroup = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;
  const updates = req.body;

  const taskGroup = await TaskGroup.findById(id);
  if (!taskGroup) {
    throw new AppError('Task group not found', 404);
  }

  // Check if user has access to this task group's project
  const projectMember = await ProjectMember.findOne({
    projectId: taskGroup.projectId,
    userId: user._id
  });

  if (!projectMember) {
    throw new AppError('Not authorized to update this task group', 403);
  }

  // Update allowed fields
  const allowedFields = ['name', 'position'];
  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      (taskGroup as any)[field] = updates[field];
    }
  });

  await taskGroup.save();

  res.json({
    success: true,
    message: 'Task group updated successfully',
    data: taskGroup,
  });
});

// Delete task group
export const deleteTaskGroup = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;

  const taskGroup = await TaskGroup.findById(id);
  if (!taskGroup) {
    throw new AppError('Task group not found', 404);
  }

  // Check if user has access to this task group's project
  const projectMember = await ProjectMember.findOne({
    projectId: taskGroup.projectId,
    userId: user._id
  });

  if (!projectMember || !['owner', 'admin', 'member'].includes(projectMember.role)) {
    throw new AppError('Not authorized to delete this task group', 403);
  }

  // Delete all tasks in the group
  // First delete task labels
  const tasks = await Task.find({ taskGroupId: id });
  const taskIds = tasks.map(t => t._id);
  await TaskLabel.deleteMany({ taskId: { $in: taskIds } });

  // Delete tasks
  await Task.deleteMany({ taskGroupId: id });

  // Delete the group
  await TaskGroup.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Task group deleted successfully',
  });
});
