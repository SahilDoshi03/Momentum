import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User, AuthToken } from '../models';
import { config } from '../config';
import { RegisterRequest, LoginRequest, AuthResponse, JWTPayload, IUser } from '../types';
import { AppError, asyncHandler } from '../middleware';

// Generate JWT token
const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn as any });
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

  // Create user
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
    user: user.toJSON() as unknown as IUser,
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
    user: user.toJSON() as unknown as IUser,
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
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.active) {
      res.json({
        success: true,
        data: { valid: false, user: null },
      });
      return;
    }

    res.json({
      success: true,
      data: { valid: true, user: user.toJSON() as unknown as IUser },
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

  res.json({
    success: true,
    data: user.toJSON() as unknown as IUser,
  });
});

// Google OAuth callback
export const googleCallback = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  if (!user) {
    throw new AppError('Google authentication failed', 401);
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

  // Redirect to frontend
  res.redirect(`${config.frontendUrl}/?token=${token}`);
});
