import express from 'express';
import {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  getTeamMembers
} from '../controllers/teamController';
import { authenticateToken } from '../middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all teams for user
router.get('/', getTeams);

// Get team by ID
router.get('/:id', getTeamById);

// Create team
router.post('/', createTeam);

// Update team
router.put('/:id', updateTeam);

// Delete team
router.delete('/:id', deleteTeam);

// Add team member
router.post('/:id/members', addTeamMember);

// Get team members
router.get('/:id/members', getTeamMembers);

// Remove team member
router.delete('/:id/members/:userId', removeTeamMember);

export default router;

