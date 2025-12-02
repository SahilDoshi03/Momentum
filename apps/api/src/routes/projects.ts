import express from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
  getProjectLabels,
  createProjectLabel,
  updateProjectLabel,
  deleteProjectLabel,
  updateProjectMember
} from '../controllers/projectController';
import { authenticateToken, validateCreateProject, validateProjectId, validateCreateProjectLabel, requireProjectPermission } from '../middleware';
import { PROJECT_PERMISSIONS } from '../config/permissions';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all projects for user
router.get('/', getProjects);

// Get project by ID
router.get('/:id', validateProjectId, getProjectById);

// Create project
router.post('/', validateCreateProject, createProject);

// Update project
router.put('/:id', validateProjectId, requireProjectPermission(PROJECT_PERMISSIONS.UPDATE_SETTINGS), updateProject);

// Delete project
router.delete('/:id', validateProjectId, requireProjectPermission(PROJECT_PERMISSIONS.DELETE_PROJECT), deleteProject);

// Add project member
router.post('/:id/members', validateProjectId, requireProjectPermission(PROJECT_PERMISSIONS.MANAGE_MEMBERS), addProjectMember);

// Remove project member
router.delete('/:id/members/:userId', validateProjectId, requireProjectPermission(PROJECT_PERMISSIONS.MANAGE_MEMBERS), removeProjectMember);

// Update project member role
router.put('/:id/members/:userId', validateProjectId, requireProjectPermission(PROJECT_PERMISSIONS.MANAGE_MEMBERS), updateProjectMember);

// Get project labels
router.get('/:id/labels', validateProjectId, getProjectLabels);

// Create project label
router.post('/:id/labels', validateProjectId, validateCreateProjectLabel, requireProjectPermission(PROJECT_PERMISSIONS.MANAGE_CONTENT), createProjectLabel);

// Update project label
router.put('/:id/labels/:labelId', validateProjectId, requireProjectPermission(PROJECT_PERMISSIONS.MANAGE_CONTENT), updateProjectLabel);

// Delete project label
router.delete('/:id/labels/:labelId', validateProjectId, requireProjectPermission(PROJECT_PERMISSIONS.MANAGE_CONTENT), deleteProjectLabel);

export default router;
