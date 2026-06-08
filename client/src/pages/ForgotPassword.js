import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MdDirectionsBike, MdEmail } from 'react-icons/md';
import axios from 'axios';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post((process.env.REACT_APP_API_URL || 'http://localhost:5000') + '/api/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
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
          <h2>Forgot your password?</h2>
          <p>No worries! Enter your email address and we'll send you a link to reset your password.</p>
          <div className="login-info-box">
            <div>
              <strong>🔒 Secure Reset</strong>
              <p>Your reset link will expire in 1 hour for your security.</p>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="auth-right">
          <div className="auth-form-container">

            {submitted ? (
              <div className="forgot-success">
                <div className="forgot-success-icon">📧</div>
                <h2>Check your email!</h2>
                <p>We've sent a password reset link to <strong>{email}</strong>. Check your inbox and follow the instructions.</p>
                <p className="forgot-success-note">Didn't receive it? Check your spam folder or <button onClick={() => setSubmitted(false)} className="forgot-retry-btn">try again</button>.</p>
                <Link to="/login" className="auth-btn" style={{ display: 'block', textAlign: 'center', marginTop: '24px', textDecoration: 'none' }}>
                  Back to Sign In
                </Link>
              </div>
            ) : (
              <>
                <h2>Reset Password</h2>
                <p>Enter your email and we'll send you a reset link.</p>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Email Address</label>
                    <div className="input-wrapper">
                      <MdEmail className="input-icon" />
                      <input
                        type="email"
                        placeholder="natalia@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  <button type="submit" className="auth-btn" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#666' }}>
                  Remember your password? <Link to="/login" style={{ color: '#2d7a4f', fontWeight: 600 }}>Sign in</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
