import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../api';
import { getStaffToken, getStaffUser, setStaffAuth, clearStaffAuth } from '../utils/authStorage';

/**
 * ProtectedRoute – strictly guards routes based on required role ('admin' vs 'kitchen')
 * - Admin route requires admin_token and user.role === 'admin'
 * - Kitchen route requires kitchen_token and user.role === 'kitchen'
 * Cross-role authentication reuse is strictly prohibited.
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  const role = requiredRole === 'kitchen' ? 'kitchen' : 'admin';

  const token = getStaffToken(role);
  const user = getStaffUser(role);

  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(token && user && user.role === role));
  const [userRole, setUserRole] = useState(user?.role || null);

  useEffect(() => {
    if (!token || !user || user.role !== role) {
      setIsAuthenticated(false);
      setIsValidating(false);
      return;
    }

    let isMounted = true;

    // Verify token with backend API (/api/auth/me)
    api.get('/auth/me')
      .then(res => {
        if (!isMounted) return;
        if (res.data?.success) {
          const verifiedUser = res.data.data;
          if (verifiedUser.role === role) {
            setStaffAuth(role, token, verifiedUser);
            setUserRole(verifiedUser.role);
            setIsAuthenticated(true);
          } else {
            // Invalidate target role if response role mismatches
            clearStaffAuth(role);
            setIsAuthenticated(false);
          }
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        if (err.response && err.response.status === 401) {
          clearStaffAuth(role);
          setIsAuthenticated(false);
        } else {
          // Keep local auth if role strictly matches
          setIsAuthenticated(user.role === role);
        }
      })
      .finally(() => {
        if (isMounted) setIsValidating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token, role]);

  const loginRedirectPath = role === 'kitchen' ? '/kitchen/login' : '/admin/login';

  if (!token || !user || user.role !== role || (!isValidating && !isAuthenticated)) {
    return <Navigate to={loginRedirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
