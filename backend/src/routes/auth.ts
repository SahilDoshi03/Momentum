import express from 'express';
import passport from 'passport';
import { register, login, logout, validateToken, getMe, googleCallback } from '../controllers/authController';
import { validateRegister, validateLogin, authenticateToken, authLimiter } from '../middleware';

const router = express.Router();

// Apply rate limiting to auth routes
router.use(authLimiter);

// Register
router.post('/register', validateRegister, register);

// Login
router.post('/login', validateLogin, login);

// Logout
router.post('/logout', logout);

// Validate token
router.post('/validate', validateToken);

// Get current user
router.get('/me', authenticateToken, getMe);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=google_auth_failed` }),
  googleCallback
);

export default router;
