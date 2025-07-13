import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Configure base URL for development/production
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' 
  : 'https://your-production-api.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      SecureStore.deleteItemAsync('authToken');
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Authentication
  verifyEmail: async (email) => {
    return api.post('/auth/verify', { email });
  },

  verifyCode: async (email, code) => {
    return api.post('/auth/verify', { email, code });
  },

  // Reports
  submitReport: async (reportData) => {
    return api.post('/reports', reportData);
  },

  getUserReports: async () => {
    return api.get('/reports/user');
  },

  getReport: async (reportId) => {
    return api.get(`/reports/${reportId}`);
  },

  // Stats
  getStats: async () => {
    return api.get('/stats');
  },

  // City integration
  notifyCity: async (reportId) => {
    return api.post('/city/notify', { reportId });
  },

  // Photo upload
  uploadPhoto: async (photoUri) => {
    const formData = new FormData();
    formData.append('photo', {
      uri: photoUri,
      type: 'image/jpeg',
      name: 'roadkill-photo.jpg',
    });

    return api.post('/upload/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default api; 