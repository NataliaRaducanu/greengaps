import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { getProfile, updateProfile, uploadProfilePicture, deleteAccount } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MdDirectionsBike, MdWarning } from 'react-icons/md';
import './ProfileSettings.css';

const ProfileSettings = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    email_notifications: 1,
    status_notifications: 1,
    weekly_digest: 0,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await getProfile();
      setProfile(res.data);
      setFormData({
        full_name: res.data.full_name || '',
        email: res.data.email || '',
        phone: res.data.phone || '',
        email_notifications: res.data.email_notifications ?? 1,
        status_notifications: res.data.status_notifications ?? 1,
        weekly_digest: res.data.weekly_digest ?? 0,
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await updateProfile(formData);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const data = new FormData();
    data.append('picture', file);
    try {
      const res = await uploadProfilePicture(data);
      setProfile(prev => ({ ...prev, profile_picture: res.data.profile_picture }));
      setSuccess('Profile picture updated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to upload picture');
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!deletePassword) {
      setDeleteError('Please enter your password to confirm.');
      return;
    }
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteAccount({ password: deletePassword });
      logout();
      navigate('/');
    } catch (err) {
      setDeleteError(err.response?.data?.error || 'Failed to delete account.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div><Navbar /><div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div></div>;

  return (
    <div className="profile-page">
      <Navbar />
      <div className="profile-content">
        <h1>Profile Settings</h1>
        <p className="profile-subtitle">Manage your account information and preferences</p>

        {/* Profile Header Card */}
        <div className="profile-header-card">
          <div
            className="profile-avatar"
            onClick={() => fileInputRef.current.click()}
            style={{ cursor: 'pointer' }}
          >
            {profile?.profile_picture ? (
              <img
                src={`(process.env.REACT_APP_API_URL || 'http://localhost:5000')${profile.profile_picture}`}
                alt="Profile"
                style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <MdDirectionsBike size={32} color="#2d7a4f" />
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePictureUpload}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <div className="profile-info">
            <h2>{formData.full_name || formData.email}</h2>
            <p>{formData.email}</p>
            <button
              className="change-photo-btn"
              type="button"
              onClick={() => fileInputRef.current.click()}
            >
              Change Profile Picture
            </button>
          </div>
          <div className="profile-stats">
            <div className="profile-stat">
              <span className="profile-stat-number green">{profile?.total_reports || 0}</span>
              <span className="profile-stat-label">Total Reports</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-number">{profile?.in_progress || 0}</span>
              <span className="profile-stat-label">In Progress</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-number">{profile?.resolved || 0}</span>
              <span className="profile-stat-label">Resolved</span>
            </div>
          </div>
        </div>

        {success && <div className="profile-success">{success}</div>}
        {error && <div className="profile-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Personal Information */}
          <div className="profile-card">
            <h3>Personal Information</h3>
            <div className="profile-form-grid">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="full_name"
                  autoComplete="off"
                  value={formData.full_name.split(' ')[0]}
                  onChange={(e) => {
                    const lastName = formData.full_name.split(' ').slice(1).join(' ');
                    setFormData(prev => ({ ...prev, full_name: `${e.target.value} ${lastName}`.trim() }));
                  }}
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  autoComplete="off"
                  value={formData.full_name.split(' ').slice(1).join(' ')}
                  onChange={(e) => {
                    const firstName = formData.full_name.split(' ')[0];
                    setFormData(prev => ({ ...prev, full_name: `${firstName} ${e.target.value}`.trim() }));
                  }}
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  autoComplete="off"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Phone Number (Optional)</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="07123 456 789"
                />
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="profile-card">
            <h3>Notifications Preferences</h3>
            <div className="notification-options">
              <div className="notification-option">
                <div>
                  <strong>Email Notifications</strong>
                  <p>Receive updates via email</p>
                </div>
                <input
                  type="checkbox"
                  name="email_notifications"
                  checked={formData.email_notifications === 1}
                  onChange={handleChange}
                />
              </div>
              <div className="notification-option">
                <div>
                  <strong>Report Status Updates</strong>
                  <p>Get notified when report status changes</p>
                </div>
                <input
                  type="checkbox"
                  name="status_notifications"
                  checked={formData.status_notifications === 1}
                  onChange={handleChange}
                />
              </div>
              <div className="notification-option">
                <div>
                  <strong>Weekly Digest</strong>
                  <p>Summary of activity and updates</p>
                </div>
                <input
                  type="checkbox"
                  name="weekly_digest"
                  checked={formData.weekly_digest === 1}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="profile-actions">
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            <button type="button" className="btn-cancel-profile" onClick={fetchProfile}>
              Cancel
            </button>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="profile-card danger-zone">
          <h3><MdWarning size={18} color="#dc2626" /> Danger Zone</h3>
          <div className="danger-zone-content">
            <div>
              <strong>Delete Account</strong>
              <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
            </div>
            <button
              className="btn-delete-account"
              onClick={() => setShowDeleteModal(true)}
              type="button"
            >
              Delete Account
            </button>
          </div>
        </div>

      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="delete-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="delete-modal" onClick={e => e.stopPropagation()}>
            <div className="delete-modal-header">
              <div className="delete-modal-icon">⚠️</div>
              <h2>Delete Account</h2>
              <p>This will permanently delete your account, all your reports, notifications and forum posts. This action <strong>cannot be undone</strong>.</p>
            </div>

            {deleteError && <div className="profile-error">{deleteError}</div>}

            <form onSubmit={handleDeleteAccount}>
              <div className="delete-modal-form-group">
                <label>Enter your password to confirm</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="delete-modal-actions">
                <button
                  type="button"
                  className="btn-cancel-profile"
                  onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteError(''); }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-confirm-delete"
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete My Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSettings;
