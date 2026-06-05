import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  MdDirectionsBike, MdDashboard, MdArticle,
  MdBarChart, MdPeople, MdSettings, MdForum,
} from 'react-icons/md';
import './Admin.css';

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };
  const isActive = (path) => location.pathname === path;

  return (
    <div className="admin-wrapper">
      <nav className="admin-navbar">
        <div className="admin-navbar-brand">
          <MdDirectionsBike size={28} color="white" />
          <div>
            <span className="admin-navbar-name">GreenGaps Admin</span>
            <span className="admin-navbar-sub">Birmingham Cycling Infrastructure</span>
          </div>
        </div>
        <div className="admin-navbar-right">
          <span className="admin-navbar-user">Admin {user?.full_name || user?.email}</span>
          <button className="admin-logout-btn" onClick={handleLogout}>Sign Out</button>
        </div>
      </nav>

      <div className="admin-body">
        <aside className="admin-sidebar">
          <nav className="admin-sidebar-nav">
            <Link to="/admin" className={isActive('/admin') ? 'active' : ''}>
              <MdDashboard size={18} /> Dashboard
            </Link>
            <Link to="/admin/reports" className={isActive('/admin/reports') ? 'active' : ''}>
              <MdArticle size={18} /> Reports
            </Link>
            <Link to="/admin/analytics" className={isActive('/admin/analytics') ? 'active' : ''}>
              <MdBarChart size={18} /> Analytics
            </Link>
            <Link to="/admin/users" className={isActive('/admin/users') ? 'active' : ''}>
              <MdPeople size={18} /> Users
            </Link>
            <Link to="/admin/forum" className={isActive('/admin/forum') ? 'active' : ''}>
              <MdForum size={18} /> Forum
            </Link>
            <Link to="/admin/settings" className={isActive('/admin/settings') ? 'active' : ''}>
              <MdSettings size={18} /> Settings
            </Link>
          </nav>
        </aside>
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;