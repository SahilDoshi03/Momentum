import express from 'express';
import {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  getTeamMembers,
  updateTeamMember
} from '../controllers/teamController';
import { createInvite } from '../controllers/inviteController';
import { authenticateToken, requireTeamPermission } from '../middleware';
import { TEAM_PERMISSIONS } from '../config/permissions';

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
router.put('/:id', requireTeamPermission(TEAM_PERMISSIONS.UPDATE_SETTINGS), updateTeam);

// Delete team
router.delete('/:id', requireTeamPermission(TEAM_PERMISSIONS.DELETE_TEAM), deleteTeam);

// Add team member
router.post('/:id/members', requireTeamPermission(TEAM_PERMISSIONS.MANAGE_MEMBERS), addTeamMember);

// Get team members
router.get('/:id/members', getTeamMembers);

// Create invite
router.post('/:id/invites', requireTeamPermission(TEAM_PERMISSIONS.MANAGE_MEMBERS), createInvite);

// Remove team member
router.delete('/:id/members/:userId', requireTeamPermission(TEAM_PERMISSIONS.MANAGE_MEMBERS), removeTeamMember);

// Update team member role
router.put('/:id/members/:userId', requireTeamPermission(TEAM_PERMISSIONS.MANAGE_MEMBERS), updateTeamMember);

export default router;
