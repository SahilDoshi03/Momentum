import express from 'express';
import { getLabelColors } from '../controllers/labelColorController';

const router = express.Router();

// Get all label colors (public endpoint)
router.get('/', getLabelColors);

export default router;
