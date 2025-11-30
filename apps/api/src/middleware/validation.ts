import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.type === 'field' ? error.path : 'unknown',
        message: error.msg,
      })),
    });
    return;
  }
  next();
};

// Auth validation
export const validateRegister = [
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  handleValidationErrors,
];

export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors,
];

// User validation
export const validateUserUpdate = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),
  handleValidationErrors,
];

// Team validation
export const validateCreateTeam = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Team name must be between 2 and 100 characters'),
  body('organizationId')
    .optional()
    .isMongoId()
    .withMessage('Invalid organization ID'),
  handleValidationErrors,
];

export const validateTeamId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid team ID'),
  handleValidationErrors,
];

// Project validation
export const validateCreateProject = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Project name must be between 2 and 100 characters'),
  body('teamId')
    .optional()
    .isMongoId()
    .withMessage('Invalid team ID'),

  handleValidationErrors,
];

export const validateProjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid project ID'),
  handleValidationErrors,
];

// Task Group validation
export const validateCreateTaskGroup = [
  body('projectId')
    .isMongoId()
    .withMessage('Invalid project ID'),
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Task group name must be between 1 and 100 characters'),
  body('position')
    .optional()
    .isNumeric()
    .withMessage('Position must be a number'),
  handleValidationErrors,
];

export const validateTaskGroupId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid task group ID'),
  handleValidationErrors,
];

// Task validation
export const validateCreateTask = [
  body('taskGroupId')
    .isMongoId()
    .withMessage('Invalid task group ID'),
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Task name must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid due date format'),
  body('hasTime')
    .optional()
    .isBoolean()
    .withMessage('hasTime must be a boolean'),
  handleValidationErrors,
];

export const validateTaskId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID'),
  handleValidationErrors,
];

export const validateUpdateTask = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Task name must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid due date format'),
  body('hasTime')
    .optional()
    .isBoolean()
    .withMessage('hasTime must be a boolean'),
  body('complete')
    .optional()
    .isBoolean()
    .withMessage('complete must be a boolean'),
  body('position')
    .optional()
    .isNumeric()
    .withMessage('position must be a number'),
  body('taskGroupId')
    .optional()
    .isMongoId()
    .withMessage('Invalid task group ID'),
  handleValidationErrors,
];

// Comment validation
export const validateCreateComment = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Comment must be between 1 and 2000 characters'),
  body('pinned')
    .optional()
    .isBoolean()
    .withMessage('pinned must be a boolean'),
  handleValidationErrors,
];

// Label validation
export const validateCreateProjectLabel = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Label name must be between 1 and 50 characters'),
  body('labelColorId')
    .isMongoId()
    .withMessage('Invalid label color ID'),
  handleValidationErrors,
];

// Query validation
export const validateMyTasksQuery = [
  query('status')
    .optional()
    .isIn(['ALL', 'INCOMPLETE', 'COMPLETE_ALL', 'COMPLETE_TODAY', 'COMPLETE_YESTERDAY', 'COMPLETE_ONE_WEEK', 'COMPLETE_TWO_WEEK', 'COMPLETE_THREE_WEEK'])
    .withMessage('Invalid status filter'),
  query('sort')
    .optional()
    .isIn(['NONE', 'PROJECT', 'DUE_DATE'])
    .withMessage('Invalid sort option'),
  handleValidationErrors,
];


