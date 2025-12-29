import express from 'express';
import { sendMessage } from '../controllers/chatbotController';
import { authenticateToken } from '../middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Send message to chatbot
router.post('/message', sendMessage);

export default router;
