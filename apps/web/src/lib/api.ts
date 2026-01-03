// API client for backend communication

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

export interface User {
  _id: string;
  email: string;
  fullName: string;
  initials: string;
  bio: string;
  profileIcon: {
    url?: string;
    initials: string;
    bgColor: string;
  };
  role: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  _id: string;
  name: string;
  teamId?: string | { _id: string; name: string; organizationId: string };
  createdAt: string;
  publicOn?: string;
  members?: Array<{
    _id: string;
    userId: User;
    role: string;
    addedAt: string;
  }>;
  currentUserRole?: string;
  taskGroups?: Array<{
    _id: string;
    name: string;
    position: number;
    tasks?: Array<Task>;
  }>;
  labels?: Array<{
    _id: string;
    name: string;
    labelColorId: {
      _id: string;
      name: string;
      colorHex: string;
    };
  }>;
}

export interface Task {
  _id: string;
  taskGroupId: string | {
    _id: string;
    name: string;
    projectId: string | {
      _id: string;
      name: string;
    };
  };
  name: string;
  description?: string;
  position: number;
  complete: boolean;
  completedAt?: string;
  dueDate?: string;
  hasTime: boolean;
  createdAt: string;
  createdBy?: User;
  updatedBy?: User;
  assigned?: Array<{
    _id: string;
    userId: User;
    assignedDate: string;
  }>;
  labels?: Array<{
    _id: string;
    projectLabelId: {
      _id: string;
      name: string;
      labelColorId: {
        _id: string;
        name: string;
        colorHex: string;
      };
    };
    assignedDate: string;
  }>;
}

export interface LabelColor {
  _id: string;
  name: string;
  colorHex: string;
  position: number;
}

export interface Team {
  _id: string;
  name: string;
  organizationId: string | {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Custom error class for API errors
export class ApiError extends Error {
  public statusCode: number;
  public isExpected: boolean;

  constructor(message: string, statusCode: number, isExpected: boolean = true) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.isExpected = isExpected;

    // Prevent Next.js error overlay for expected errors (like validation failures)
    if (isExpected && typeof window !== 'undefined') {
      // Suppress the error from being reported to Next.js error overlay
      Object.defineProperty(this, 'stack', {
        get: () => undefined,
      });
    }
  }
}

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: HeadersInit;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

    const headers: Record<string, string> = {
      ...(this.defaultHeaders as Record<string, string>),
      ...(options.headers as Record<string, string>),
    };

    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include', // Include cookies for authentication
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Determine if this is an expected error (4xx) or unexpected (5xx)
        const isExpected = response.status >= 400 && response.status < 500;
        throw new ApiError(
          data.message || `HTTP error! status: ${response.status}`,
          response.status,
          isExpected
        );
      }

      return data;
    } catch (error) {
      // Only log unexpected errors to console
      if (!(error instanceof ApiError) || !error.isExpected) {
        console.error('API request failed:', error);
      }
      throw error;
    }
  }

  // Auth endpoints
  async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    initials?: string;
  }): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout(): Promise<ApiResponse> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async validateToken(): Promise<ApiResponse<{ valid: boolean; user: User | null }>> {
    return this.request('/auth/validate', {
      method: 'POST',
    });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request('/auth/me');
  }

  // User endpoints
  async getUsers(): Promise<ApiResponse<User[]>> {
    return this.request('/users');
  }

  async getUserById(id: string): Promise<ApiResponse<User>> {
    return this.request(`/users/${id}`);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<ApiResponse<User>> {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteUser(id: string): Promise<ApiResponse> {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async searchUsers(query: string): Promise<ApiResponse<User[]>> {
    return this.request(`/users/search?query=${encodeURIComponent(query)}`);
  }

  // Project endpoints
  async getProjects(teamId?: string): Promise<ApiResponse<Project[]>> {
    const params = teamId ? `?teamId=${teamId}` : '';
    return this.request(`/projects${params}`);
  }

  async getProjectById(id: string): Promise<ApiResponse<Project>> {
    return this.request(`/projects/${id}`);
  }

  async createProject(projectData: {
    name: string;
    teamId?: string;
  }): Promise<ApiResponse<Project>> {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<ApiResponse<Project>> {
    return this.request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProject(id: string): Promise<ApiResponse> {
    return this.request(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  async addProjectMember(projectId: string, userId: string, role: string = 'member'): Promise<ApiResponse> {
    return this.request(`/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId, role }),
    });
  }

  async removeProjectMember(projectId: string, userId: string): Promise<ApiResponse> {
    return this.request(`/projects/${projectId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  async updateProjectMember(projectId: string, userId: string, role: string): Promise<ApiResponse> {
    return this.request(`/projects/${projectId}/members/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async getProjectLabels(projectId: string): Promise<ApiResponse> {
    return this.request(`/projects/${projectId}/labels`);
  }

  async createProjectLabel(projectId: string, labelData: {
    name: string;
    labelColorId: string;
  }): Promise<ApiResponse> {
    return this.request(`/projects/${projectId}/labels`, {
      method: 'POST',
      body: JSON.stringify(labelData),
    });
  }

  async updateProjectLabel(projectId: string, labelId: string, updates: {
    name?: string;
    labelColorId?: string;
  }): Promise<ApiResponse> {
    return this.request(`/projects/${projectId}/labels/${labelId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProjectLabel(projectId: string, labelId: string): Promise<ApiResponse> {
    return this.request(`/projects/${projectId}/labels/${labelId}`, {
      method: 'DELETE',
    });
  }

  // Team endpoints
  async getTeams(): Promise<ApiResponse<Team[]>> {
    return this.request('/teams');
  }

  async getTeamById(id: string): Promise<ApiResponse<Team>> {
    return this.request(`/teams/${id}`);
  }

  async createTeam(teamData: {
    name: string;
    organizationId?: string;
  }): Promise<ApiResponse<Team>> {
    return this.request('/teams', {
      method: 'POST',
      body: JSON.stringify(teamData),
    });
  }

  async updateTeam(id: string, updates: Partial<Team>): Promise<ApiResponse<Team>> {
    return this.request(`/teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTeam(id: string): Promise<ApiResponse> {
    return this.request(`/teams/${id}`, {
      method: 'DELETE',
    });
  }

  async addTeamMember(teamId: string, userId: string, role: string = 'member'): Promise<ApiResponse> {
    return this.request(`/teams/${teamId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId, role }),
    });
  }

  async removeTeamMember(teamId: string, userId: string): Promise<ApiResponse> {
    return this.request(`/teams/${teamId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  async updateTeamMember(teamId: string, userId: string, role: string): Promise<ApiResponse> {
    return this.request(`/teams/${teamId}/members/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async getTeamMembers(teamId: string): Promise<ApiResponse<unknown[]>> {
    return this.request(`/teams/${teamId}/members`);
  }

  async createTeamInvite(teamId: string, email: string): Promise<ApiResponse<{ token: string; expiresAt: string }>> {
    return this.request(`/teams/${teamId}/invites`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async getInviteDetails(token: string): Promise<ApiResponse<{ teamId: { _id: string; name: string }; creatorId: string }>> {
    return this.request(`/invites/${token}`);
  }

  async acceptTeamInvite(token: string): Promise<ApiResponse<{ teamId: string }>> {
    return this.request(`/invites/${token}/accept`, {
      method: 'POST',
    });
  }

  // Task endpoints
  async getMyTasks(status: string = 'ALL', sort: string = 'NONE'): Promise<ApiResponse<{
    tasks: Task[];
    projects: Array<{ projectID: string; taskID: string }>;
  }>> {
    return this.request(`/tasks/my-tasks?status=${status}&sort=${sort}`);
  }

  async createTask(taskData: {
    taskGroupId: string;
    name: string;
    description?: string;
    dueDate?: string;
    hasTime?: boolean;
  }): Promise<ApiResponse<Task>> {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async createTaskGroup(groupData: {
    projectId: string;
    name: string;
    position?: number;
  }): Promise<ApiResponse<{ _id: string; name: string; position: number; tasks: Task[] }>> {
    return this.request('/tasks/groups', {
      method: 'POST',
      body: JSON.stringify(groupData),
    });
  }

  async updateTaskGroup(id: string, updates: {
    name?: string;
    position?: number;
  }): Promise<ApiResponse<{ _id: string; name: string; position: number }>> {
    return this.request(`/tasks/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTaskGroup(id: string): Promise<ApiResponse> {
    return this.request(`/tasks/groups/${id}`, {
      method: 'DELETE',
    });
  }

  async getTaskById(id: string): Promise<ApiResponse<Task>> {
    return this.request(`/tasks/${id}`);
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<ApiResponse<Task>> {
    return this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTask(id: string): Promise<ApiResponse> {
    return this.request(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  async assignUserToTask(taskId: string, userId: string): Promise<ApiResponse> {
    return this.request(`/tasks/${taskId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async unassignUserFromTask(taskId: string, userId: string): Promise<ApiResponse> {
    return this.request(`/tasks/${taskId}/assign/${userId}`, {
      method: 'DELETE',
    });
  }

  async addLabelToTask(taskId: string, projectLabelId: string): Promise<ApiResponse> {
    return this.request(`/tasks/${taskId}/labels`, {
      method: 'POST',
      body: JSON.stringify({ projectLabelId }),
    });
  }

  async removeLabelFromTask(taskId: string, labelId: string): Promise<ApiResponse> {
    return this.request(`/tasks/${taskId}/labels/${labelId}`, {
      method: 'DELETE',
    });
  }

  // Chatbot endpoints
  async sendChatMessage(message: string, conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<ApiResponse<{
    response: string;
    toolResults?: unknown[];
  }>> {
    return this.request('/chatbot/message', {
      method: 'POST',
      body: JSON.stringify({ message, conversationHistory }),
    });
  }

  // Label color endpoints
  async getLabelColors(): Promise<ApiResponse<LabelColor[]>> {
    return this.request('/label-colors');
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// Export types for use in components

