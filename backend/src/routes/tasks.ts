import express from 'express';
import { 
  getMyTasks, 
  createTask, 
  getTaskById, 
  updateTask, 
  deleteTask,
  assignUserToTask,
  unassignUserFromTask,
  addLabelToTask,
  removeLabelFromTask
} from '../controllers/taskController';
import { authenticateToken, validateCreateTask, validateTaskId, validateUpdateTask, validateMyTasksQuery } from '../middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get my tasks
router.get('/my-tasks', validateMyTasksQuery, getMyTasks);

// Create task
router.post('/', validateCreateTask, createTask);

// Get task by ID
router.get('/:id', validateTaskId, getTaskById);

// Update task
router.put('/:id', validateTaskId, validateUpdateTask, updateTask);

// Delete task
router.delete('/:id', validateTaskId, deleteTask);

// Assign user to task
router.post('/:id/assign', validateTaskId, assignUserToTask);

// Unassign user from task
router.delete('/:id/assign/:userId', validateTaskId, unassignUserFromTask);

// Add label to task
router.post('/:id/labels', validateTaskId, addLabelToTask);

// Remove label from task
router.delete('/:id/labels/:labelId', validateTaskId, removeLabelFromTask);

export default router;
