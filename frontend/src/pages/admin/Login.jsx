import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api';
import { setStaffAuth } from '../../utils/authStorage';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const isKitchenLogin = location.pathname.startsWith('/kitchen');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data.success) {
        const { token, user } = response.data.data;
        
        // Strict role authorization check per portal route
        if (location.pathname.startsWith('/kitchen') && user.role !== 'kitchen') {
          setError('Access denied. Kitchen portal requires Kitchen credentials.');
          return;
        }

        if (location.pathname.startsWith('/admin') && user.role !== 'admin') {
          setError('Access denied. Admin portal requires Admin credentials.');
          return;
        }

        // Save role-isolated credentials
        setStaffAuth(user.role, token, user);
        
        if (user.role === 'kitchen') {
          navigate('/kitchen');
        } else if (user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          setError('Unauthorized staff role.');
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error?.message || 'Invalid credentials.');
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <h2>{isKitchenLogin ? 'Kitchen Portal' : 'Staff Portal'}</h2>
          <p>{isKitchenLogin ? 'Sign in with Kitchen ID & Password' : 'Sign in with Admin ID & Password'}</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              value={credentials.email}
              onChange={handleChange}
              placeholder="Enter Email ID"
              required 
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              value={credentials.password}
              onChange={handleChange}
              placeholder="Enter Password"
              required 
            />
          </div>

          <button type="submit" className="login-btn">
            {isKitchenLogin ? 'Login to Kitchen' : 'Login to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
