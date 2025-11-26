import express from 'express';
import passport from 'passport';
import { register, login, logout, validateToken, getMe, googleCallback, githubCallback } from '../controllers/authController';
import { validateRegister, validateLogin, authenticateToken, authLimiter } from '../middleware';

const router = express.Router();

// Register
router.post('/register', authLimiter, validateRegister, register);

// Login
router.post('/login', authLimiter, validateLogin, login);

// Logout
router.post('/logout', logout);

// Validate token
router.post('/validate', validateToken);

// Get current user
router.get('/me', authenticateToken, getMe);

// Google OAuth routes
router.get('/google', authLimiter, passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=google_auth_failed` }),
  googleCallback
);

// GitHub OAuth routes
router.get('/github', authLimiter, passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=github_auth_failed` }),
  githubCallback
);

export default router;
