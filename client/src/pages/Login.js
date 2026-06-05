import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginApi } from '../services/api';
import { MdDirectionsBike, MdEmail, MdLock } from 'react-icons/md';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginApi({
        email: formData.email,
        password: formData.password
      });
      login(res.data.user, res.data.token);

      // Redirect based on role
      if (res.data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/map');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      {/* Top Navbar */}
      <nav className="auth-nav">
        <div className="auth-nav-brand">
          <MdDirectionsBike size={26} color="white" />
          <div className="auth-nav-title">
            <span className="auth-nav-name">GreenGaps</span>
            <span className="auth-nav-subtitle">Birmingham Cycling Infrastructure</span>
          </div>
        </div>
        <Link to="/" className="auth-nav-back">Back to home</Link>
      </nav>

      <div className="auth-page">
        {/* Left Panel */}
        <div className="auth-left">
          <div className="auth-left-logo">
            <MdDirectionsBike size={40} color="white" />
          </div>
          <h2>Welcome Back!</h2>
          <p>Sign in to continue improving Birmingham's cycling infrastructure.</p>
          <div className="login-info-box">
            <div>
              <strong>💡 Did you know?</strong>
              <p>342 infrastructure gaps have been resolved thanks to community reports like yours!</p>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="auth-right">
          <div className="auth-form-container">
            <h2>Sign In</h2>
            <p>Don't have an account? <Link to="/register">Sign up</Link></p>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email Address</label>
                <div className="input-wrapper">
                  <MdEmail className="input-icon" />
                  <input
                    type="email"
                    name="email"
                    placeholder="natalia@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Password *</label>
                <div className="input-wrapper">
                  <MdLock className="input-icon" />
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-checkbox">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    id="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                  />
                  <label htmlFor="rememberMe">Remember me</label>
                </div>
                <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
              </div>

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="auth-divider"><span>Or continue with</span></div>

            <div className="auth-social">
              <button className="social-btn">🔵 Google</button>
              <button className="social-btn">✉️ Microsoft</button>
            </div>

            <div className="login-notice">
              <span>ℹ️</span>
              <p><strong>New to GreenGaps?</strong> You can browse the map without an account, but you'll need to sign in to submit and track reports.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;