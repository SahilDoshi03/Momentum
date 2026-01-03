import express from 'express';
import {
  getUsers,
  getUserById,
  getCurrentUser,
  updateUser,
  deleteUser,
  getUserTeams,
  getUserProjects,
  searchUsers
} from '../controllers/userController';
import { authenticateToken, requireAdmin, validateUserUpdate } from '../middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all users (admin only)
router.get('/', requireAdmin, getUsers);

// Search users
router.get('/search', searchUsers);

// Get current user with roles
router.get('/me', getCurrentUser);

// Get user by ID
router.get('/:id', getUserById);

// Update user profile
router.put('/:id', validateUserUpdate, updateUser);

// Delete user (admin or self)
router.delete('/:id', deleteUser);

// Get user's teams
router.get('/:id/teams', getUserTeams);

// Get user's projects
router.get('/:id/projects', getUserProjects);

export default router;
