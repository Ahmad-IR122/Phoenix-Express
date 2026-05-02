import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
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
  config.headers['x-mock-auth-mode'] = 'employee-dev';

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
    }
  } catch (error) {
    return config;
  }

  return config;
});

export default API;
