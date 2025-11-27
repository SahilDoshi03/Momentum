import express from 'express';
import { getInvite, acceptInvite } from '../controllers/inviteController';
import { authenticateToken } from '../middleware';

const router = express.Router();

// Get invite details (public)
router.get('/:token', getInvite);

// Accept invite (requires auth)
router.post('/:token/accept', authenticateToken, acceptInvite);

export default router;
