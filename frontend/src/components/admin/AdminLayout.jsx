import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import '../../pages/admin/AdminStyles.css';

const AdminLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  return (
    <div className="admin-layout-container">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">SmartServe Admin</div>
        <nav className="sidebar-nav">
          <NavLink to="/admin/dashboard" className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>Dashboard</NavLink>
          <NavLink to="/admin/menu" className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>Menu Management</NavLink>
          <NavLink to="/admin/categories" className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>Categories</NavLink>
          <NavLink to="/admin/tables" className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>Tables</NavLink>
          <NavLink to="/admin/orders" className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>Orders</NavLink>
          <NavLink to="/admin/billing" className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>Billing</NavLink>
          <NavLink to="/admin/stock" className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>Stock</NavLink>
          <NavLink to="/admin/reports" className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>Reports</NavLink>
          
          <button
            onClick={handleLogout}
            className="sidebar-logout"
          >
            ↩ Logout
          </button>
        </nav>
      </aside>

      <main className="admin-main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
