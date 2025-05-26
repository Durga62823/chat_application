import axios from 'axios';

// Define the API base URL
const API_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const API = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 second timeout
  withCredentials: false, // Important: set to false for local development
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});
 
// Add auth token to requests
API.interceptors.request.use((config) => {
  console.log(`Making request to: ${config.url}`);
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  console.error('API request error:', error);
  return Promise.reject(error);
});

// Handle response errors
API.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    if (error.code === 'ERR_NETWORK') {
      console.error('Network error - Server might be down:', error);
    } else if (error.response) {
      console.error(`Error ${error.response.status} from ${error.config?.url}:`, error.response.data);
    } else {
      console.error('Unknown error:', error);
    }
    return Promise.reject(error);
  }
);

// Simple ping test that doesn't rely on database
export const pingServer = async () => {
  try {
    const response = await API.get('/ping');
    console.log('Ping successful:', response.data);
    return true;
  } catch (error) {
    console.error('Ping failed:', error);
    return false;
  }
};

// Test API connection
export const testConnection = async () => {
  try {
    const response = await API.get('/test');
    console.log('API Connection successful:', response.data);
    return true;
  } catch (error) {
    console.error('API Connection failed:', error);
    return false;
  }
};

// Auth API functions
export const registerUser = async (userData) => {
  try {
    console.log('Registering with data:', userData);
    const response = await API.post('/auth/register', userData);
    console.log('Registration successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Registration API error:', error);
    throw error;
  }
};

export const loginUser = async (credentials) => {
  try {
    console.log('Logging in with:', credentials.phoneNumber);
    const response = await API.post('/auth/login', credentials);
    console.log('Login successful');
    return response.data;
  } catch (error) {
    console.error('Login API error:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    const response = await API.post('/auth/logout');
    return response.data;
  } catch (error) {
    console.error('Logout API error:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await API.get('/auth/profile');
    return response.data;
  } catch (error) {
    console.error('Get user profile error:', error);
    throw error;
  }
};

// Chat API functions
export const fetchChats = async () => {
  try {
    const response = await API.get('/channels');
    return response.data;
  } catch (error) {
    console.error('Fetch chats error:', error);
    return []; // Return empty array as fallback
  }
};

export const fetchMessages = async (channelId) => {
  try {
    const response = await API.get(`/channels/${channelId}/messages`);
    return response.data;
  } catch (error) {
    console.error(`Fetch messages error for channel ${channelId}:`, error);
    return []; // Return empty array as fallback
  }
};

// User search function
export const searchUsers = async (query) => {
  try {
    const response = await API.get(`/users/search?query=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    console.error('Search users error:', error);
    return []; // Return empty array as fallback
  }
};

// Update user avatar
export const updateUserAvatar = async (avatarUrl) => {
  try {
    const response = await API.patch('/auth/profile', { avatar: avatarUrl });
    return response.data;
  } catch (error) {
    console.error('Update avatar error:', error);
    throw error;
  }
};