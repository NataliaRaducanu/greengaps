import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getNotifications } from '../../services/api';
import {
  MdDirectionsBike, MdMap, MdArticle, MdInfo,
  MdHelp, MdNotifications, MdPerson, MdForum, MdSearch, MdMenu, MdClose
} from 'react-icons/md';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      getNotifications()
        .then((res) => {
          const unread = res.data.filter((n) => !n.is_read).length;
          setUnreadCount(unread);
        })
        .catch(() => {});
    }
  }, [user, location]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowDropdown(false);
    setMenuOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">
          <Link to={user ? '/map' : '/'}>
            <MdDirectionsBike size={28} color="white" />
            <div className="navbar-title">
              <span className="navbar-name">GreenGaps</span>
              <span className="navbar-subtitle">Birmingham Cycling Infrastructure</span>
            </div>
          </Link>
        </div>

        {/* Desktop actions */}
        <div className="navbar-actions">
          {showSearch ? (
            <form onSubmit={handleSearch} className="navbar-search-form">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="navbar-search-input"
              />
              <button type="submit" className="navbar-search-submit">
                <MdSearch size={18} color="white" />
              </button>
              <button type="button" className="navbar-search-cancel" onClick={() => setShowSearch(false)}>
                ✕
              </button>
            </form>
          ) : (
            <button className="navbar-icon" onClick={() => setShowSearch(true)} title="Search">
              <MdSearch size={22} color="white" />
            </button>
          )}

          {user ? (
            <>
              <Link to="/notifications" className="navbar-icon">
                <MdNotifications size={24} color="white" />
                {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
              </Link>
              <div className="navbar-user" onClick={() => setShowDropdown(!showDropdown)}>
                <MdPerson size={24} color="white" />
                {showDropdown && (
                  <div className="dropdown">
                    <Link to="/profile" onClick={() => setShowDropdown(false)}>Profile Settings</Link>
                    <button onClick={handleLogout}>Sign Out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-outline">Sign In</Link>
              <Link to="/register" className="btn-primary">Register</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="navbar-hamburger"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <MdClose size={26} color="white" /> : <MdMenu size={26} color="white" />}
        </button>
      </nav>

      {/* Desktop secondary nav */}
      {user && (
        <div className="navbar-secondary">
          <Link to="/map" className={isActive('/map') ? 'active' : ''}>
            <MdMap size={18} /> Map
          </Link>
          <Link to="/my-reports" className={isActive('/my-reports') ? 'active' : ''}>
            <MdArticle size={18} /> My Reports
          </Link>
          <Link to="/forum" className={isActive('/forum') ? 'active' : ''}>
            <MdForum size={18} /> Forum
          </Link>
          <Link to="/about" className={isActive('/about') ? 'active' : ''}>
            <MdInfo size={18} /> About
          </Link>
          <Link to="/help" className={isActive('/help') ? 'active' : ''}>
            <MdHelp size={18} /> Help
          </Link>
        </div>
      )}

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="navbar-mobile-drawer">
          {user ? (
            <>
              <Link to="/map" className={isActive('/map') ? 'active' : ''}>
                <MdMap size={18} /> Map
              </Link>
              <Link to="/my-reports" className={isActive('/my-reports') ? 'active' : ''}>
                <MdArticle size={18} /> My Reports
              </Link>
              <Link to="/forum" className={isActive('/forum') ? 'active' : ''}>
                <MdForum size={18} /> Forum
              </Link>
              <Link to="/about" className={isActive('/about') ? 'active' : ''}>
                <MdInfo size={18} /> About
              </Link>
              <Link to="/help" className={isActive('/help') ? 'active' : ''}>
                <MdHelp size={18} /> Help
              </Link>
              <div className="navbar-mobile-divider" />
              <Link to="/notifications" onClick={() => setMenuOpen(false)}>
                <MdNotifications size={18} /> Notifications
                {unreadCount > 0 && <span className="badge-inline">{unreadCount}</span>}
              </Link>
              <Link to="/profile" onClick={() => setMenuOpen(false)}>
                <MdPerson size={18} /> Profile Settings
              </Link>
              <button onClick={handleLogout}>Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)}>Sign In</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}>Register</Link>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default Navbar;