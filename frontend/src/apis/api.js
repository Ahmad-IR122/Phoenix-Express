import axios from 'axios';

const FALLBACK_API_BASE_URL = 'http://localhost:5000/api';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || FALLBACK_API_BASE_URL;

const API = axios.create({
  baseURL: API_BASE_URL,
});

API.interceptors.request.use((config) => {
  const storedUser =
    typeof window !== 'undefined'
      ? localStorage.getItem('user') || sessionStorage.getItem('user')
      : null;
  const storedToken =
    typeof window !== 'undefined'
      ? localStorage.getItem('token') || sessionStorage.getItem('token')
      : null;

  config.headers = config.headers || {};

  if (!storedUser) {
    return config;
  }

  try {
    const user = JSON.parse(storedUser);

    const token = user?.token || storedToken;
    const userId = user?.id || user?.userId || user?.user_id;
    const role = user?.role;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (userId) {
      config.headers['x-user-id'] = userId;
    }

    if (role) {
      config.headers['x-user-role'] = role;
      config.headers['x-mock-auth-mode'] = `${role}-dev`;
    }
  } catch (error) {
    return config;
  }

  return config;
});

export default API;
