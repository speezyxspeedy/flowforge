/**
 * FlowForge API Client
 * Wraps all backend endpoints with standardized error handling and responses.
 */
const API = {
  baseUrl: '',

  async request(endpoint, options = {}) {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);

      if (!response.ok) {
        let errorDetail = `HTTP ${response.status} ${response.statusText}`;
        try {
          const errorJson = await response.json();
          if (errorJson.detail) {
            errorDetail = typeof errorJson.detail === 'string'
              ? errorJson.detail
              : JSON.stringify(errorJson.detail);
          }
        } catch (_) {}

        throw new Error(errorDetail);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, error);
      throw error;
    }
  },

  // Health
  async getHealth() {
    return this.request('/api/health');
  },

  // Dashboard & Overview
  async getOverview() {
    return this.request('/api/dashboard/overview');
  },

  async getAnalytics() {
    return this.request('/api/dashboard/analytics');
  },

  async seedDemoWorkspace() {
    return this.request('/api/dashboard/seed-demo', { method: 'POST' });
  },

  // Projects
  async getProjects(status = null, search = null, sortBy = 'recent') {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    if (sortBy) params.append('sort_by', sortBy);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/api/projects${query}`);
  },

  async getProject(id) {
    return this.request(`/api/projects/${id}`);
  },

  async createProject(projectData) {
    return this.request('/api/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  },

  async updateProject(id, projectData) {
    return this.request(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
  },

  async toggleArchiveProject(id, archive = true) {
    return this.request(`/api/projects/${id}/archive?archive=${archive}`, {
      method: 'POST',
    });
  },

  async deleteProject(id) {
    return this.request(`/api/projects/${id}`, {
      method: 'DELETE',
    });
  },

  // Tasks
  async getTasks(filters = {}) {
    const params = new URLSearchParams();
    if (filters.projectId) params.append('project_id', filters.projectId);
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.dueFilter) params.append('due_filter', filters.dueFilter);
    if (filters.search) params.append('search', filters.search);
    if (filters.sortBy) params.append('sort_by', filters.sortBy);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/api/tasks${query}`);
  },

  async getTask(id) {
    return this.request(`/api/tasks/${id}`);
  },

  async createTask(taskData) {
    return this.request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  },

  async updateTask(id, taskData) {
    return this.request(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    });
  },

  async updateTaskStatus(id, newStatus, position = null) {
    const payload = { status: newStatus };
    if (position !== null) payload.position = position;
    return this.request(`/api/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async updateTaskPriority(id, priority) {
    return this.request(`/api/tasks/${id}/priority`, {
      method: 'PATCH',
      body: JSON.stringify({ priority }),
    });
  },

  async deleteTask(id) {
    return this.request(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
  },

  getExportCsvUrl(projectId = null) {
    return projectId ? `/api/tasks/export/csv?project_id=${projectId}` : '/api/tasks/export/csv';
  },

  // Activity
  async getActivity(filters = {}) {
    const params = new URLSearchParams();
    if (filters.projectId) params.append('project_id', filters.projectId);
    if (filters.eventType) params.append('event_type', filters.eventType);
    if (filters.limit) params.append('limit', filters.limit || 50);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/api/activity${query}`);
  },
};

window.API = API;
