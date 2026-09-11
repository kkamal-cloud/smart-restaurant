/**
 * Role-Based Staff Authentication Storage Utility
 * Isolates Admin and Kitchen credentials so they NEVER overwrite each other.
 * Stores under admin_token/admin_user and kitchen_token/kitchen_user in both sessionStorage & localStorage.
 */

export const getStaffToken = (role) => {
  if (role === 'kitchen') {
    return sessionStorage.getItem('kitchen_token') || localStorage.getItem('kitchen_token');
  }
  if (role === 'admin') {
    return sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token');
  }
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/kitchen')) {
    return sessionStorage.getItem('kitchen_token') || localStorage.getItem('kitchen_token');
  }
  return sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token');
};

export const getStaffUser = (role) => {
  let userRaw = null;
  if (role === 'kitchen') {
    userRaw = sessionStorage.getItem('kitchen_user') || localStorage.getItem('kitchen_user');
  } else if (role === 'admin') {
    userRaw = sessionStorage.getItem('admin_user') || localStorage.getItem('admin_user');
  } else if (typeof window !== 'undefined' && window.location.pathname.startsWith('/kitchen')) {
    userRaw = sessionStorage.getItem('kitchen_user') || localStorage.getItem('kitchen_user');
  } else {
    userRaw = sessionStorage.getItem('admin_user') || localStorage.getItem('admin_user');
  }

  try {
    return userRaw ? JSON.parse(userRaw) : null;
  } catch {
    return null;
  }
};

export const setStaffAuth = (role, token, user) => {
  const prefix = role === 'kitchen' ? 'kitchen' : 'admin';
  sessionStorage.setItem(`${prefix}_token`, token);
  sessionStorage.setItem(`${prefix}_user`, JSON.stringify(user));
  localStorage.setItem(`${prefix}_token`, token);
  localStorage.setItem(`${prefix}_user`, JSON.stringify(user));
};

export const clearStaffAuth = (role) => {
  if (role === 'kitchen' || (!role && typeof window !== 'undefined' && window.location.pathname.startsWith('/kitchen'))) {
    sessionStorage.removeItem('kitchen_token');
    sessionStorage.removeItem('kitchen_user');
    localStorage.removeItem('kitchen_token');
    localStorage.removeItem('kitchen_user');
  }
  if (role === 'admin' || (!role && typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'))) {
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_user');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  }
};
