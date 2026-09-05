import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../api';

/**
 * ProtectedRoute – guards a route by checking:
 *  1. JWT token and user presence in localStorage
 *  2. Verification of token with backend API (/api/auth/me)
 *  3. Matching required role without invalidating token on mismatch
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  const userRaw = sessionStorage.getItem('user') || localStorage.getItem('user');
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(token && userRaw));
  const [userRole, setUserRole] = useState(() => {
    try {
      return userRaw ? JSON.parse(userRaw).role : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!token || !userRaw) {
      setIsAuthenticated(false);
      setIsValidating(false);
      return;
    }

    let isMounted = true;

    try {
      const user = JSON.parse(userRaw);
      setUserRole(user.role);
    } catch {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      setIsValidating(false);
      return;
    }

    // Verify token with backend
    api.get('/auth/me')
      .then(res => {
        if (!isMounted) return;
        if (res.data?.success) {
          const user = res.data.data;
          sessionStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('user', JSON.stringify(user));
          setUserRole(user.role);
          setIsAuthenticated(true);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        // Only invalidate session if server explicitly returned 401
        if (err.response && err.response.status === 401) {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
        } else {
          // Keep authenticated if token format is fine
          setIsAuthenticated(true);
        }
      })
      .finally(() => {
        if (isMounted) setIsValidating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token, userRaw]);

  if (!token || !userRaw || (!isValidating && !isAuthenticated)) {
    return <Navigate to="/admin/login" replace />;
  }

  // Check role match if requiredRole is provided
  if (requiredRole) {
    const rolesArray = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!userRole || !rolesArray.includes(userRole)) {
      // Redirect to login page if role is missing or not authorized
      return <Navigate to="/admin/login" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
