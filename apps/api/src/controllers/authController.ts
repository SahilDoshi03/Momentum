import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User, AuthToken } from '../models';
import { config } from '../config';
import { RegisterRequest, LoginRequest, AuthResponse, JWTPayload, IUser } from '../types';
import { AppError, asyncHandler } from '../middleware';
import { validatePassword, VALIDATION_CONFIG } from '../utils/passwordValidation';

// Generate JWT token
const generateToken = (userId: string): string => {
  // Add random nonce to ensure uniqueness even if generated within the same second
  return jwt.sign({ userId, nonce: Math.random().toString(36).substring(7) }, config.jwtSecret, { expiresIn: config.jwtExpiresIn as any });
};

// Set HTTP-only cookie
const setTokenCookie = (res: Response, token: string): void => {
  const expires = new Date();
  expires.setDate(expires.getDate() + 7); // 7 days

  res.cookie('authToken', token, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    expires,
  });
};

// Register user
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, email, password }: RegisterRequest = req.body;

  // Combine firstName and lastName into fullName
  const fullName = `${firstName} ${lastName}`.trim();

  // Check if user already exists
  const existingUser = await User.findOne({
    email,
  });

  if (existingUser) {
    throw new AppError('User with this email already exists', 400);
  }

  // Password validation
  if (!validatePassword(password)) {
    throw new AppError(VALIDATION_CONFIG.password.errorMessage, 400);
  }

  // Create user
  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 5);

  const user = new User({
    fullName,
    email,
    password,
    initials,
    profileIcon: {
      initials,
      bgColor: '#6366f1'
    },
    role: 'member',
    active: true,
  });

  await user.save();

  // Generate token
  const token = generateToken(user._id);

  // Store token in database
  const authToken = new AuthToken({
    userId: user._id,
    token,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });
  await authToken.save();

  // Set cookie
  setTokenCookie(res, token);

  const response: AuthResponse = {
    user: { ...user.toJSON(), hasPassword: true } as unknown as IUser,
    token,
  };

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: response,
  });
});

// Login user
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password }: LoginRequest = req.body;

  // Find user by email
  const user = await User.findOne({
    email,
  }).select('+password');

  if (!user || !user.active) {
    throw new AppError('Invalid credentials', 401);
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
  }

  // Generate token
  const token = generateToken(user._id);

  // Store token in database
  const authToken = new AuthToken({
    userId: user._id,
    token,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });
  await authToken.save();

  // Set cookie
  setTokenCookie(res, token);

  const response: AuthResponse = {
    user: { ...user.toJSON(), hasPassword: true } as unknown as IUser,
    token,
  };

  res.json({
    success: true,
    message: 'Login successful',
    data: response,
  });
});

// Logout user
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.authToken || req.headers.authorization?.split(' ')[1];

  if (token) {
    // Remove token from database
    await AuthToken.findOneAndDelete({ token });
  }

  // Clear cookie
  res.clearCookie('authToken');

  res.json({
    success: true,
    message: 'Logout successful',
  });
});

// Validate token
export const validateToken = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.authToken || req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.json({
      success: true,
      data: { valid: false, user: null },
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;
    const user = await User.findById(decoded.userId).select('+password');

    if (!user || !user.active) {
      res.json({
        success: true,
        data: { valid: false, user: null },
      });
      return;
    }

    const userJson = user.toJSON() as unknown as IUser;
    userJson.hasPassword = !!user.password;

    res.json({
      success: true,
      data: { valid: true, user: userJson },
    });
  } catch (error) {
    res.json({
      success: true,
      data: { valid: false, user: null },
    });
  }
});

// Get current user
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  // Check if user has password set (fetch explicitly to be sure)
  const userWithPassword = await User.findById(user._id).select('password');

  const userJson = user.toJSON() as unknown as IUser;
  userJson.hasPassword = !!userWithPassword?.password;

  res.json({
    success: true,
    data: userJson,
  });
});

// Change password
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById((req as any).user._id).select('+password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // If user has no password (e.g. social login only), they can't change it this way
  if (!user.password) {
    // Logic for users who signed up with social login can be added here
    // For now, assume password change is for email/password users or those who have set one
    throw new AppError('This account is managed via social login', 400);
  }

  // Verify current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError('Invalid current password', 401);
  }

  // Validate new password
  if (!validatePassword(newPassword)) {
    throw new AppError(VALIDATION_CONFIG.password.errorMessage, 400);
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password updated successfully',
  });
});

// Google OAuth callback
export const googleCallback = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  if (!user) {
    throw new AppError('Google authentication failed', 401);
  }

  // Reactivate user if they were soft deleted
  if (!user.active) {
    user.active = true;
    await user.save();
  }

  // Generate token
  const token = generateToken(user._id);

  // Store token in database
  const authToken = new AuthToken({
    userId: user._id,
    token,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });
  await authToken.save();

  // Set cookie
  setTokenCookie(res, token);

  // Extract invite token from state if present
  let inviteToken: string | undefined;
  try {
    const state = req.query.state as string;
    if (state) {
      const parsed = JSON.parse(state);
      inviteToken = parsed.invite;
    }
  } catch (error) {
    // Invalid state, ignore
  }

  // Redirect to frontend with invite token if present
  const inviteParam = inviteToken ? `&invite=${inviteToken}` : '';
  res.redirect(`${config.frontendUrl}/auth/callback?token=${token}${inviteParam}`);
});

// GitHub OAuth callback
export const githubCallback = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  if (!user) {
    throw new AppError('GitHub authentication failed', 401);
  }

  // Reactivate user if they were soft deleted
  if (!user.active) {
    user.active = true;
    await user.save();
  }

  // Generate token
  const token = generateToken(user._id);

  // Store token in database
  const authToken = new AuthToken({
    userId: user._id,
    token,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });
  await authToken.save();

  // Set cookie
  setTokenCookie(res, token);

  // Extract invite token from state if present
  let inviteToken: string | undefined;
  try {
    const state = req.query.state as string;
    if (state) {
      const parsed = JSON.parse(state);
      inviteToken = parsed.invite;
    }
  } catch (error) {
    // Invalid state, ignore
  }

  // Redirect to frontend with invite token if present
  const inviteParam = inviteToken ? `&invite=${inviteToken}` : '';
  res.redirect(`${config.frontendUrl}/auth/callback?token=${token}${inviteParam}`);
});
