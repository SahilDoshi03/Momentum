import { Request } from 'express';
import { Document } from 'mongoose';

// Base interfaces
export interface IUser extends Document {
  _id: string;
  email: string;
  username: string;
  password: string;
  fullName: string;
  initials: string;
  bio: string;
  profileIcon?: {
    url?: string;
    initials: string;
    bgColor: string;
  };
  role: 'owner' | 'admin' | 'member' | 'observer';
  googleId?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  generateInitials(): string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IOrganization extends Document {
  _id: string;
  name: string;
  createdAt: Date;
}

export interface ITeam extends Document {
  _id: string;
  name: string;
  organizationId: string;
  createdAt: Date;
}

export interface ITeamMember extends Document {
  _id: string;
  teamId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'observer';
  addedDate: Date;
}

export interface IProject extends Document {
  _id: string;
  name: string;
  teamId?: string;
  createdAt: Date;
  publicOn?: Date;
}

export interface IProjectMember extends Document {
  _id: string;
  projectId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'observer';
  addedAt: Date;
}

export interface ITaskGroup extends Document {
  _id: string;
  projectId: string;
  name: string;
  position: number;
  createdAt: Date;
  tasks?: ITask[];
}

export interface ITask extends Document {
  _id: string;
  taskGroupId: string;
  name: string;
  description?: string;
  position: number;
  complete: boolean;
  completedAt?: Date;
  dueDate?: Date;
  hasTime: {
    type: boolean,
    default: false,
  },
  assigned: Array<{
    userId: string;
    assignedDate: Date;
  }>;
  labels: Array<{
    projectLabelId: string;
    assignedDate: Date;
  }>;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITaskAssigned extends Document {
  _id: string;
  taskId: string;
  userId: string;
  assignedDate: Date;
}

export interface ITaskLabel extends Document {
  _id: string;
  taskId: string;
  projectLabelId: string;
  assignedDate: Date;
}

export interface IProjectLabel extends Document {
  _id: string;
  projectId: string;
  name: string;
  labelColorId: string;
  createdDate: Date;
}

export interface ILabelColor extends Document {
  _id: string;
  name: string;
  colorHex: string;
  position: number;
}

export interface ITaskChecklist extends Document {
  _id: string;
  taskId: string;
  name: string;
  position: number;
  createdAt: Date;
}

export interface ITaskChecklistItem extends Document {
  _id: string;
  checklistId: string;
  name: string;
  complete: boolean;
  position: number;
  dueDate?: Date;
  createdAt: Date;
}

export interface ITaskComment extends Document {
  _id: string;
  taskId: string;
  userId: string;
  message: string;
  pinned: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface IAuthToken extends Document {
  _id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface IPersonalProject extends Document {
  _id: string;
  userId: string;
  projectId: string;
}

// API Request/Response interfaces
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  initials?: string;
}

export interface AuthResponse {
  user: IUser;
  token: string;
}

export interface CreateTeamRequest {
  name: string;
  organizationId?: string;
}

export interface CreateProjectRequest {
  name: string;
  teamId?: string;
}

export interface CreateTaskGroupRequest {
  projectId: string;
  name: string;
  position?: number;
}

export interface CreateTaskRequest {
  taskGroupId: string;
  name: string;
  description?: string;
  dueDate?: Date;
  hasTime?: boolean;
}

export interface UpdateTaskRequest {
  name?: string;
  description?: string;
  dueDate?: Date;
  hasTime?: boolean;
  complete?: boolean;
  position?: number;
  taskGroupId?: string;
}

export interface CreateProjectLabelRequest {
  projectId: string;
  name: string;
  labelColorId: string;
}

export interface CreateTaskCommentRequest {
  taskId: string;
  message: string;
  pinned?: boolean;
}

export interface CreateChecklistRequest {
  taskId: string;
  name: string;
  position?: number;
}

export interface CreateChecklistItemRequest {
  checklistId: string;
  name: string;
  position?: number;
  dueDate?: Date;
}

// Extended interfaces with populated fields
export interface IUserWithRoles extends IUser {
  organizationRole?: string;
  teamRoles: Array<{ teamId: string; role: string }>;
  projectRoles: Array<{ projectId: string; role: string }>;
}

export interface IProjectWithDetails extends IProject {
  team?: ITeam;
  members: Array<IProjectMember & { user: IUser }>;
  taskGroups: Array<ITaskGroup & { tasks: Array<ITask & { assigned: Array<ITaskAssigned & { user: IUser }>; labels: Array<ITaskLabel & { projectLabel: IProjectLabel }> }> }>;
  labels: Array<IProjectLabel & { labelColor: ILabelColor }>;
}

export interface ITaskWithDetails extends ITask {
  taskGroup: ITaskGroup;
  assigned: Array<ITaskAssigned & { user: IUser }>;
  labels: Array<ITaskLabel & { projectLabel: IProjectLabel & { labelColor: ILabelColor } }>;
  comments: Array<ITaskComment & { user: IUser }>;
  checklists: Array<ITaskChecklist & { items: ITaskChecklistItem[] }>;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

// Express Request extensions
export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

// API Error Response
export interface ApiError {
  message: string;
  status: number;
  errors?: Array<{ field: string; message: string }>;
}


