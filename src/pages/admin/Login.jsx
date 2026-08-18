import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

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
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        
        if (response.data.data.user.role === 'kitchen') {
          navigate('/kitchen');
        } else {
          navigate('/admin/dashboard');
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
          <h2>Admin Portal</h2>
          <p>Sign in to manage SmartServe</p>
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
              placeholder='Enter Password'
              required 
            />
          </div>

          <button type="submit" className="login-btn">
            Login to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
