import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/v1/auth/login', credentials),
  selectOrganization: (organizationId) => {
    // Ensure we're sending only a primitive number value (Long)
    let orgId = typeof organizationId === 'object' 
      ? (organizationId?.id || organizationId?.organizationId || null)
      : organizationId;
    
    // Validate and convert to number
    if (orgId == null || orgId === '' || orgId === undefined) {
      throw new Error('Organization ID is required');
    }
    
    orgId = Number(orgId);
    if (isNaN(orgId) || orgId <= 0) {
      throw new Error(`Invalid organization ID: ${organizationId}`);
    }
    
    const requestBody = { organizationId: orgId };
    return api.post('/v1/auth/select-organization', requestBody);
  },
  logout: () => api.post('/v1/auth/logout'),
  getCurrentUser: () => api.get('/v1/auth/me'),
};

export default api;

