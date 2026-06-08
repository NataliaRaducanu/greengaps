import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { MdDirectionsBike, MdLock } from 'react-icons/md';
import axios from 'axios';
import './Auth.css';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/reset-password/${token}`)

      .then(() => setTokenValid(true))
      .catch(() => setTokenValid(false))
      .finally(() => setValidating(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/reset-password`, { token, password });

      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
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
        {/* Left panel */}
        <div className="auth-left">
          <div className="auth-left-logo">
            <MdDirectionsBike size={40} color="white" />
          </div>
          <h2>Create New Password</h2>
          <p>Choose a strong password to keep your GreenGaps account secure.</p>
          <div className="login-info-box">
            <div>
              <strong>💡 Password Tips</strong>
              <p>Use at least 6 characters with a mix of letters and numbers for a strong password.</p>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="auth-right">
          <div className="auth-form-container">

            {validating ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                Validating reset link...
              </div>
            ) : !tokenValid ? (
              <div className="forgot-success">
                <div className="forgot-success-icon">❌</div>
                <h2>Invalid or Expired Link</h2>
                <p>This password reset link is invalid or has expired. Please request a new one.</p>
                <Link to="/forgot-password" className="auth-btn" style={{ display: 'block', textAlign: 'center', marginTop: '24px', textDecoration: 'none' }}>
                  Request New Link
                </Link>
              </div>
            ) : success ? (
              <div className="forgot-success">
                <div className="forgot-success-icon">✅</div>
                <h2>Password Reset!</h2>
                <p>Your password has been reset successfully. Redirecting you to sign in...</p>
              </div>
            ) : (
              <>
                <h2>New Password</h2>
                <p>Enter your new password below.</p>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>New Password</label>
                    <div className="input-wrapper">
                      <MdLock className="input-icon" />
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Confirm Password</label>
                    <div className="input-wrapper">
                      <MdLock className="input-icon" />
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="auth-btn" disabled={loading}>
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
