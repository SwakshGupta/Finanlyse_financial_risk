/**
 * Finalyse Frontend API Service Layer
 * Interacts with Express backend endpoints via Vite dev proxy.
 */

const API_BASE = '/api/v1';

class ApiService {
  getToken() {
    return localStorage.getItem('token');
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const res = await fetch(url, config);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMsg =
          data?.error?.message ||
          data?.message ||
          `Request failed with status ${res.status}`;
        const err = new Error(errorMsg);
        err.status = res.status;
        err.code = data?.error?.code || 'API_ERROR';
        err.details = data?.error?.details || [];
        throw err;
      }

      return data;
    } catch (err) {
      // Re-throw formatted error
      throw err;
    }
  }

  // Auth Endpoints
  async login(credentials) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (res.accessToken) {
      this.setToken(res.accessToken);
    }
    return res;
  }

  async register(userData) {
    const res = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (res.accessToken) {
      this.setToken(res.accessToken);
    }
    return res;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // System Health
  async checkHealth() {
    try {
      const res = await fetch('/health');
      return res.ok;
    } catch {
      return false;
    }
  }

  // Applications
  async listApplications() {
    return this.request('/applications');
  }

  async getApplication(applicationId) {
    return this.request(`/applications/${applicationId}`);
  }

  async createApplication(payload) {
    return this.request('/applications', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Financial Ingestion
  async submitFinancialProfile(applicationId, profile) {
    return this.request(`/applications/${applicationId}/financial-profile`, {
      method: 'POST',
      body: JSON.stringify(profile),
    });
  }

  async ingestSyntheticPreset(applicationId, presetName) {
    return this.request(`/applications/${applicationId}/synthetic`, {
      method: 'POST',
      body: JSON.stringify({ presetName }),
    });
  }

  async uploadCsvTransactions(applicationId, csvContent) {
    return this.request(`/applications/${applicationId}/csv-transactions`, {
      method: 'POST',
      body: JSON.stringify({ csvContent }),
    });
  }

  async getFinancialSummary(applicationId) {
    return this.request(`/applications/${applicationId}/financial-summary`);
  }

  // Risk Assessment
  async runAssessment(applicationId, options = {}) {
    return this.request(`/applications/${applicationId}/assess`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  async getAssessment(applicationId) {
    return this.request(`/applications/${applicationId}/assessment`);
  }
}

export const api = new ApiService();
export default api;
