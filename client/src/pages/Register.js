import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register } from '../services/api';
import { MdDirectionsBike } from 'react-icons/md';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
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

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    if (!formData.agreeTerms) {
      return setError('Please agree to the Terms of Service');
    }
    if (formData.password.length < 8) {
      return setError('Password must be at least 8 characters');
    }

    setLoading(true);
    try {
      const res = await register({
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password
      });
      login(res.data.user, res.data.token);
      navigate('/map');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
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
          <h2>Join GreenGaps Today</h2>
          <p>Be part of a community making Birmingham safer and more accessible for cyclists.</p>
          <div className="auth-features">
            <div className="auth-feature">
              <span className="auth-check">✓</span>
              <div>
                <strong>Report Infrastructure Gaps</strong>
                <p>Help identify areas needing improvement</p>
              </div>
            </div>
            <div className="auth-feature">
              <span className="auth-check">✓</span>
              <div>
                <strong>Track Your Submissions</strong>
                <p>Monitor progress and receive updates</p>
              </div>
            </div>
            <div className="auth-feature">
              <span className="auth-check">✓</span>
              <div>
                <strong>Make a Real Impact</strong>
                <p>Contribute to data-driven city planning</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="auth-right">
          <div className="auth-form-container">
            <h2>Create Account</h2>
            <p>Already have an account? <Link to="/login">Sign in</Link></p>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name *</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    name="full_name"
                    placeholder="Natalia Raducanu"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <div className="input-wrapper">
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
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <small>Must be at least 8 characters</small>
              </div>

              <div className="form-group">
                <label>Confirm Password *</label>
                <div className="input-wrapper">
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="••••••••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-checkbox">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  id="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                />
                <label htmlFor="agreeTerms">
                  I agree to the <Link to="/privacy">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>
                </label>
              </div>

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="auth-divider"><span>Or continue with</span></div>

            <div className="auth-social">
              <button className="social-btn">🔵 Google</button>
              <button className="social-btn">✉️ Microsoft</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;