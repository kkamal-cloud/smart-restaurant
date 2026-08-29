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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const token = localStorage.getItem('token');
      const isSessionError = error.response.data?.message?.toLowerCase().includes('session') ||
                            error.response.data?.error?.message?.toLowerCase().includes('session') ||
                            error.response.data?.error?.message === 'Invalid or expired session token';
      
      if (!token || isSessionError) {
        localStorage.removeItem('sessionId');
        localStorage.removeItem('joinToken');
        localStorage.removeItem('customer');
        localStorage.removeItem('smartserve_cart'); // Clear cart too
        
        const path = window.location.pathname;
        if (!path.startsWith('/admin') && !path.startsWith('/kitchen') && path !== '/') {
          alert('Your dining session has ended. Please scan the QR code to start a new session.');
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  return `${baseUrl}${imagePath}`;
};

export default api;
