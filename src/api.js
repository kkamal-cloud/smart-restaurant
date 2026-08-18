import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api`, // Pointing to our backend
});

// Optionally add interceptors here to include auth token or session token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // for admin/staff
    const joinToken = localStorage.getItem('joinToken'); // for customers

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    if (joinToken) {
      config.headers['x-join-token'] = joinToken;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
