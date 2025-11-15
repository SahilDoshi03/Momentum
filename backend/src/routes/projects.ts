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
  deleteProjectLabel
} from '../controllers/projectController';
import { authenticateToken, validateCreateProject, validateProjectId, validateCreateProjectLabel } from '../middleware';

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
router.put('/:id', validateProjectId, updateProject);

// Delete project
router.delete('/:id', validateProjectId, deleteProject);

// Add project member
router.post('/:id/members', validateProjectId, addProjectMember);

// Remove project member
router.delete('/:id/members/:userId', validateProjectId, removeProjectMember);

// Get project labels
router.get('/:id/labels', validateProjectId, getProjectLabels);

// Create project label
router.post('/:id/labels', validateProjectId, validateCreateProjectLabel, createProjectLabel);

// Update project label
router.put('/:id/labels/:labelId', validateProjectId, updateProjectLabel);

// Delete project label
router.delete('/:id/labels/:labelId', validateProjectId, deleteProjectLabel);

export default router;
