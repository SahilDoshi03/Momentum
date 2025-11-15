import { Request, Response } from 'express';
import { Task, TaskGroup, TaskAssigned, TaskLabel, ProjectMember, ProjectLabel } from '../models';
import { AppError, asyncHandler } from '../middleware';

// Get my tasks
export const getMyTasks = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { status = 'ALL', sort = 'NONE' } = req.query;

  // Get all tasks assigned to user
  const taskAssignments = await TaskAssigned.find({ userId: user._id })
    .populate({
      path: 'taskId',
      populate: [
        { path: 'taskGroupId', populate: { path: 'projectId', select: 'name shortId' } },
        { path: 'assigned', populate: { path: 'userId', select: 'username fullName initials profileIcon' } },
        { path: 'labels', populate: { path: 'projectLabelId', populate: { path: 'labelColorId' } } }
      ]
    });

  let tasks = taskAssignments.map(ta => ta.taskId).filter(task => task !== null);

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
      tasks.sort((a, b) => a.taskGroupId.projectId.name.localeCompare(b.taskGroupId.projectId.name));
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
    projectID: task.taskGroupId.projectId._id,
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
  const taskGroup = await TaskGroup.findById(taskGroupId).populate('projectId');
  if (!taskGroup) {
    throw new AppError('Task group not found', 404);
  }

  const projectMember = await ProjectMember.findOne({ 
    projectId: taskGroup.projectId._id, 
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
  });

  await task.save();

  // Assign to creator if they have member role or higher
  if (['owner', 'admin', 'member'].includes(projectMember.role)) {
    const taskAssigned = new TaskAssigned({
      taskId: task._id,
      userId: user._id,
    });
    await taskAssigned.save();
  }

  const populatedTask = await Task.findById(task._id)
    .populate('taskGroupId', 'name projectId')
    .populate({
      path: 'assigned',
      populate: { path: 'userId', select: 'username fullName initials profileIcon' }
    })
    .populate({
      path: 'labels',
      populate: { path: 'projectLabelId', populate: { path: 'labelColorId' } }
    });

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

  const task = await Task.findById(id)
    .populate('taskGroupId', 'name projectId')
    .populate({
      path: 'assigned',
      populate: { path: 'userId', select: 'username fullName initials profileIcon' }
    })
    .populate({
      path: 'labels',
      populate: { path: 'projectLabelId', populate: { path: 'labelColorId' } }
    });

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  // Check if user has access to this task's project
  const projectMember = await ProjectMember.findOne({ 
    projectId: task.taskGroupId.projectId, 
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

  const task = await Task.findById(id).populate('taskGroupId', 'projectId');
  if (!task) {
    throw new AppError('Task not found', 404);
  }

  // Check if user has access to this task's project
  const projectMember = await ProjectMember.findOne({ 
    projectId: task.taskGroupId.projectId, 
    userId: user._id 
  });

  if (!projectMember) {
    throw new AppError('Not authorized to update this task', 403);
  }

  // Update allowed fields
  const allowedFields = ['name', 'description', 'dueDate', 'hasTime', 'complete', 'position', 'taskGroupId'];
  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      task[field] = updates[field];
    }
  });

  await task.save();

  const populatedTask = await Task.findById(task._id)
    .populate('taskGroupId', 'name projectId')
    .populate({
      path: 'assigned',
      populate: { path: 'userId', select: 'username fullName initials profileIcon' }
    })
    .populate({
      path: 'labels',
      populate: { path: 'projectLabelId', populate: { path: 'labelColorId' } }
    });

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

  const task = await Task.findById(id).populate('taskGroupId', 'projectId');
  if (!task) {
    throw new AppError('Task not found', 404);
  }

  // Check if user has access to this task's project
  const projectMember = await ProjectMember.findOne({ 
    projectId: task.taskGroupId.projectId, 
    userId: user._id 
  });

  if (!projectMember || !['owner', 'admin', 'member'].includes(projectMember.role)) {
    throw new AppError('Not authorized to delete this task', 403);
  }

  // Delete related data
  await TaskAssigned.deleteMany({ taskId: id });
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

  const task = await Task.findById(id).populate('taskGroupId', 'projectId');
  if (!task) {
    throw new AppError('Task not found', 404);
  }

  // Check if current user has access to this task's project
  const projectMember = await ProjectMember.findOne({ 
    projectId: task.taskGroupId.projectId, 
    userId: currentUser._id 
  });

  if (!projectMember || !['owner', 'admin', 'member'].includes(projectMember.role)) {
    throw new AppError('Not authorized to assign users to this task', 403);
  }

  // Check if user is already assigned
  const existingAssignment = await TaskAssigned.findOne({ taskId: id, userId });
  if (existingAssignment) {
    throw new AppError('User is already assigned to this task', 400);
  }

  const taskAssigned = new TaskAssigned({
    taskId: id,
    userId,
  });

  await taskAssigned.save();

  res.status(201).json({
    success: true,
    message: 'User assigned to task successfully',
    data: taskAssigned,
  });
});

// Unassign user from task
export const unassignUserFromTask = asyncHandler(async (req: Request, res: Response) => {
  const { id, userId } = req.params;
  const currentUser = (req as any).user;

  const task = await Task.findById(id).populate('taskGroupId', 'projectId');
  if (!task) {
    throw new AppError('Task not found', 404);
  }

  // Check if current user has access to this task's project
  const projectMember = await ProjectMember.findOne({ 
    projectId: task.taskGroupId.projectId, 
    userId: currentUser._id 
  });

  if (!projectMember || !['owner', 'admin', 'member'].includes(projectMember.role)) {
    throw new AppError('Not authorized to unassign users from this task', 403);
  }

  await TaskAssigned.findOneAndDelete({ taskId: id, userId });

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

  const task = await Task.findById(id).populate('taskGroupId', 'projectId');
  if (!task) {
    throw new AppError('Task not found', 404);
  }

  // Check if user has access to this task's project
  const projectMember = await ProjectMember.findOne({ 
    projectId: task.taskGroupId.projectId, 
    userId: user._id 
  });

  if (!projectMember) {
    throw new AppError('Not authorized to modify this task', 403);
  }

  // Check if label belongs to the same project
  const projectLabel = await ProjectLabel.findById(projectLabelId);
  if (!projectLabel || projectLabel.projectId !== task.taskGroupId.projectId) {
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

  const task = await Task.findById(id).populate('taskGroupId', 'projectId');
  if (!task) {
    throw new AppError('Task not found', 404);
  }

  // Check if user has access to this task's project
  const projectMember = await ProjectMember.findOne({ 
    projectId: task.taskGroupId.projectId, 
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
