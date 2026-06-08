import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [saved, setSaved] = useState(false);

  const [general, setGeneral] = useState({
    app_name: 'GreenGaps',
    default_city: 'Birmingham, UK',
    support_email: 'support@greengaps.co.uk',
    require_auth: true,
    auto_approve: false,
    allow_photos: true,
    max_photos: 3,
  });

  const [mapSettings, setMapSettings] = useState({
    default_zoom: 13,
    default_lat: 52.4862,
    default_lng: -1.8904,
    marker_clustering: true,
    show_heatmap: false,
  });

  const [notifications, setNotifications] = useState({
    email_on_new_report: true,
    email_on_status_change: true,
    email_on_new_user: false,
    digest_frequency: 'weekly',
    admin_alerts: true,
  });

  const [categories, setCategories] = useState([
    'Missing Cycle Lanes',
    'Dangerous Junctions',
    'Poor Road Surface',
    'Lack of Signage',
    'No Bike Parking',
    'Blocked Cycle Paths',
  ]);
  const [newCategory, setNewCategory] = useState('');

  const [security, setSecurity] = useState({
    two_factor: false,
    session_timeout: 60,
    max_login_attempts: 5,
    password_min_length: 8,
  });

  const [privacy, setPrivacy] = useState({
    data_retention_days: 365,
    allow_analytics: true,
    anonymise_exports: true,
    gdpr_mode: true,
  });

  const [broadcast, setBroadcast] = useState({
    subject: '',
    message: '',
    audience: 'subscribed',
    forum_category: '',
    forum_post_id: '',
  });
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState('');
  const [forumPosts, setForumPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Fetch forum posts when "specific_post" audience is selected
  useEffect(() => {
    if (broadcast.audience === 'specific_post' && forumPosts.length === 0) {
      setLoadingPosts(true);
      const token = localStorage.getItem('token');
      fetch(`${API}/admin/forum`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => setForumPosts(data))
        .catch(() => {})
        .finally(() => setLoadingPosts(false));
    }
  }, [broadcast.audience]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcast.subject || !broadcast.message) return;
    if (broadcast.audience === 'specific_post' && !broadcast.forum_post_id) {
      setBroadcastResult('Please select a specific forum post.');
      return;
    }
    if (broadcast.audience === 'forum_category' && !broadcast.forum_category) {
      setBroadcastResult('Please select a forum category.');
      return;
    }
    setBroadcasting(true);
    setBroadcastResult('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/admin/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(broadcast)
      });
      const data = await res.json();
      setBroadcastResult(data.message);
      if (res.ok) setBroadcast(prev => ({ ...prev, subject: '', message: '' }));
    } catch (err) {
      setBroadcastResult('Failed to send broadcast.');
    } finally {
      setBroadcasting(false);
    }
  };

  const tabs = [
    { key: 'general', label: 'General' },
    { key: 'broadcast', label: '📢 Broadcast' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'map', label: 'Map Settings' },
    { key: 'categories', label: 'Categories' },
    { key: 'security', label: 'Security' },
    { key: 'privacy', label: 'Data & Privacy' },
  ];

  const getTabTitle = () => tabs.find(t => t.key === activeTab)?.label || 'General';

  const ToggleRow = ({ label, desc, checked, onChange }) => (
    <div className="admin-settings-toggle-item">
      <div className="admin-settings-toggle-info">
        <strong>{label}</strong>
        <p>{desc}</p>
      </div>
      <input type="checkbox" checked={checked} onChange={onChange} className="admin-settings-checkbox" />
    </div>
  );

  const audienceDescriptions = {
    subscribed: 'Users with email notifications enabled.',
    all: 'Every registered user regardless of settings.',
    admins: 'Only users with the admin role.',
    forum_participants: 'Everyone who has ever posted or replied in the forum.',
    forum_category: 'Users who posted or replied in a specific forum category (e.g. Safety, Events).',
    specific_post: 'Only users who posted or replied in a specific forum thread.',
    event_rsvp: 'Users who clicked "Count me in" on any Events post.',
  };

  return (
    <AdminLayout>
      <div className="admin-page admin-settings-page">
        <div className="admin-settings-layout">

          {/* Sidebar */}
          <div className="admin-settings-sidebar">
            {tabs.map(tab => (
              <button
                key={tab.key}
                className={`admin-settings-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="admin-settings-content">
            <div className="admin-settings-content-header">
              <h1>{getTabTitle()} Settings</h1>
              <p className="admin-page-sub">Configure {getTabTitle().toLowerCase()} system settings</p>
            </div>

            {/* BROADCAST */}
            {activeTab === 'broadcast' && (
              <>
                <div className="admin-settings-card">
                  <h2>Send Broadcast Email</h2>
                  <p style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>
                    Send a targeted announcement to specific groups of GreenGaps users.
                  </p>

                  {broadcastResult && (
                    <div
                      className={broadcastResult.includes('Failed') || broadcastResult.includes('Please') ? 'admin-error' : 'admin-success'}
                      style={{ marginBottom: 16 }}
                    >
                      {broadcastResult}
                    </div>
                  )}

                  <form onSubmit={handleBroadcast}>

                    {/* Audience */}
                    <div className="admin-settings-form-group">
                      <label>Audience</label>
                      <select
                        value={broadcast.audience}
                        onChange={e => setBroadcast(prev => ({
                          ...prev,
                          audience: e.target.value,
                          forum_category: '',
                          forum_post_id: '',
                        }))}
                        className="admin-settings-input"
                      >
                        <optgroup label="General">
                          <option value="subscribed">Subscribed users only</option>
                          <option value="all">All users</option>
                          <option value="admins">Admins only</option>
                        </optgroup>
                        <optgroup label="Forum Participants">
                          <option value="forum_participants">All forum participants</option>
                          <option value="forum_category">Specific forum category</option>
                          <option value="specific_post">Specific forum post</option>
                          <option value="event_rsvp">Event RSVP'd users</option>
                        </optgroup>
                      </select>
                      <p style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>
                        {audienceDescriptions[broadcast.audience]}
                      </p>
                    </div>

                    {/* Forum category picker */}
                    {broadcast.audience === 'forum_category' && (
                      <div className="admin-settings-form-group">
                        <label>Forum Category</label>
                        <select
                          value={broadcast.forum_category}
                          onChange={e => setBroadcast(prev => ({ ...prev, forum_category: e.target.value }))}
                          className="admin-settings-input"
                          required
                        >
                          <option value="">Select a category...</option>
                          <option value="General">General</option>
                          <option value="Routes">Routes</option>
                          <option value="Safety">Safety</option>
                          <option value="Infrastructure">Infrastructure</option>
                          <option value="Events">Events</option>
                          <option value="Tips">Tips</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    )}

                    {/* Specific post picker */}
                    {broadcast.audience === 'specific_post' && (
                      <div className="admin-settings-form-group">
                        <label>Select Forum Post</label>
                        {loadingPosts ? (
                          <p style={{ fontSize: '13px', color: '#888' }}>Loading posts...</p>
                        ) : (
                          <select
                            value={broadcast.forum_post_id}
                            onChange={e => setBroadcast(prev => ({ ...prev, forum_post_id: e.target.value }))}
                            className="admin-settings-input"
                            required
                          >
                            <option value="">Select a post...</option>
                            {forumPosts.map(post => (
                              <option key={post.id} value={post.id}>
                                [{post.category}] {post.title}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}

                    {/* Subject */}
                    <div className="admin-settings-form-group">
                      <label>Subject *</label>
                      <input
                        type="text"
                        placeholder="e.g. Update on the Digbeth junction safety issue"
                        value={broadcast.subject}
                        onChange={e => setBroadcast(prev => ({ ...prev, subject: e.target.value }))}
                        className="admin-settings-input"
                        required
                      />
                    </div>

                    {/* Message */}
                    <div className="admin-settings-form-group">
                      <label>Message *</label>
                      <textarea
                        placeholder="Write your announcement here..."
                        value={broadcast.message}
                        onChange={e => setBroadcast(prev => ({ ...prev, message: e.target.value }))}
                        className="admin-settings-input"
                        rows={8}
                        style={{ resize: 'vertical' }}
                        required
                      />
                    </div>

                    <div className="admin-settings-form-actions">
                      <button
                        type="submit"
                        className="admin-settings-save-btn"
                        disabled={broadcasting || !broadcast.subject || !broadcast.message}
                      >
                        {broadcasting ? 'Sending...' : '📢 Send Broadcast'}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="admin-settings-card">
                  <h2>Audience Guide</h2>
                  <ul style={{ fontSize: '13px', color: '#555', lineHeight: '2.2', paddingLeft: '20px' }}>
                    <li><strong>Subscribed users</strong> — only users with email notifications enabled</li>
                    <li><strong>All users</strong> — every registered user regardless of settings</li>
                    <li><strong>Admins only</strong> — only users with admin role</li>
                    <li><strong>All forum participants</strong> — anyone who posted or replied anywhere in the forum</li>
                    <li><strong>Specific forum category</strong> — e.g. email everyone who engaged in Safety threads</li>
                    <li><strong>Specific forum post</strong> — only users who posted/replied in one exact thread</li>
                    <li><strong>Event RSVP'd users</strong> — users who clicked "Count me in" on any event post</li>
                  </ul>
                </div>
              </>
            )}

            {/* ALL OTHER TABS */}
            {activeTab !== 'broadcast' && (
              <form onSubmit={handleSave}>
                {saved && <div className="admin-success">Settings saved successfully!</div>}

                {/* GENERAL */}
                {activeTab === 'general' && (
                  <>
                    <div className="admin-settings-card">
                      <h2>Application Settings</h2>
                      <div className="admin-settings-form-group">
                        <label>Application Name</label>
                        <input type="text" value={general.app_name}
                          onChange={e => setGeneral(p => ({ ...p, app_name: e.target.value }))}
                          className="admin-settings-input" />
                      </div>
                      <div className="admin-settings-form-group">
                        <label>Default City</label>
                        <input type="text" value={general.default_city}
                          onChange={e => setGeneral(p => ({ ...p, default_city: e.target.value }))}
                          className="admin-settings-input" />
                      </div>
                      <div className="admin-settings-form-group">
                        <label>Support Email</label>
                        <input type="email" value={general.support_email}
                          onChange={e => setGeneral(p => ({ ...p, support_email: e.target.value }))}
                          className="admin-settings-input" />
                      </div>
                    </div>
                    <div className="admin-settings-card">
                      <h2>Report Settings</h2>
                      <ToggleRow label="Require Authentication" desc="Users must be logged in to submit reports"
                        checked={general.require_auth} onChange={e => setGeneral(p => ({ ...p, require_auth: e.target.checked }))} />
                      <ToggleRow label="Auto-approve Reports" desc="New reports visible immediately without review"
                        checked={general.auto_approve} onChange={e => setGeneral(p => ({ ...p, auto_approve: e.target.checked }))} />
                      <ToggleRow label="Allow Photo Uploads" desc="Users can attach photos to reports"
                        checked={general.allow_photos} onChange={e => setGeneral(p => ({ ...p, allow_photos: e.target.checked }))} />
                      <div className="admin-settings-form-group" style={{ marginTop: '16px' }}>
                        <label>Max Photos Per Report</label>
                        <input type="number" value={general.max_photos}
                          onChange={e => setGeneral(p => ({ ...p, max_photos: e.target.value }))}
                          className="admin-settings-input" style={{ maxWidth: '120px' }} />
                      </div>
                    </div>
                  </>
                )}

                {/* NOTIFICATIONS */}
                {activeTab === 'notifications' && (
                  <>
                    <div className="admin-settings-card">
                      <h2>Email Notifications</h2>
                      <ToggleRow label="New Report Submitted" desc="Send email to admins when a new report is submitted"
                        checked={notifications.email_on_new_report}
                        onChange={e => setNotifications(p => ({ ...p, email_on_new_report: e.target.checked }))} />
                      <ToggleRow label="Report Status Changed" desc="Notify users when their report status is updated"
                        checked={notifications.email_on_status_change}
                        onChange={e => setNotifications(p => ({ ...p, email_on_status_change: e.target.checked }))} />
                      <ToggleRow label="New User Registered" desc="Alert admins when a new user creates an account"
                        checked={notifications.email_on_new_user}
                        onChange={e => setNotifications(p => ({ ...p, email_on_new_user: e.target.checked }))} />
                      <ToggleRow label="Admin Alerts" desc="Critical system alerts sent to admin email"
                        checked={notifications.admin_alerts}
                        onChange={e => setNotifications(p => ({ ...p, admin_alerts: e.target.checked }))} />
                    </div>
                    <div className="admin-settings-card">
                      <h2>Digest Settings</h2>
                      <div className="admin-settings-form-group">
                        <label>Digest Frequency</label>
                        <select value={notifications.digest_frequency}
                          onChange={e => setNotifications(p => ({ ...p, digest_frequency: e.target.value }))}
                          className="admin-settings-input">
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="never">Never</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* MAP */}
                {activeTab === 'map' && (
                  <div className="admin-settings-card">
                    <h2>Map Configuration</h2>
                    <div className="admin-settings-form-group">
                      <label>Default Zoom Level</label>
                      <input type="number" value={mapSettings.default_zoom}
                        onChange={e => setMapSettings(p => ({ ...p, default_zoom: e.target.value }))}
                        className="admin-settings-input" style={{ maxWidth: '120px' }} />
                    </div>
                    <div className="admin-settings-form-row">
                      <div className="admin-settings-form-group">
                        <label>Default Latitude</label>
                        <input type="number" value={mapSettings.default_lat}
                          onChange={e => setMapSettings(p => ({ ...p, default_lat: e.target.value }))}
                          className="admin-settings-input" step="0.0001" />
                      </div>
                      <div className="admin-settings-form-group">
                        <label>Default Longitude</label>
                        <input type="number" value={mapSettings.default_lng}
                          onChange={e => setMapSettings(p => ({ ...p, default_lng: e.target.value }))}
                          className="admin-settings-input" step="0.0001" />
                      </div>
                    </div>
                    <ToggleRow label="Enable Marker Clustering" desc="Group nearby markers for better performance"
                      checked={mapSettings.marker_clustering}
                      onChange={e => setMapSettings(p => ({ ...p, marker_clustering: e.target.checked }))} />
                    <ToggleRow label="Show Heatmap" desc="Display a heatmap overlay on the map"
                      checked={mapSettings.show_heatmap}
                      onChange={e => setMapSettings(p => ({ ...p, show_heatmap: e.target.checked }))} />
                  </div>
                )}

                {/* CATEGORIES */}
                {activeTab === 'categories' && (
                  <div className="admin-settings-card">
                    <h2>Report Categories</h2>
                    <p style={{ fontSize: '13px', color: '#888', marginBottom: '16px' }}>
                      Manage the categories users can select when submitting a report.
                    </p>
                    <div className="admin-settings-categories-list">
                      {categories.map((cat, i) => (
                        <div key={i} className="admin-settings-category-item">
                          <span>{cat}</span>
                          <button
                            type="button"
                            className="admin-settings-category-remove"
                            onClick={() => setCategories(prev => prev.filter((_, idx) => idx !== i))}
                          >✕</button>
                        </div>
                      ))}
                    </div>
                    <div className="admin-settings-add-category">
                      <input
                        type="text"
                        placeholder="Add new category..."
                        value={newCategory}
                        onChange={e => setNewCategory(e.target.value)}
                        className="admin-settings-input"
                      />
                      <button
                        type="button"
                        className="admin-settings-save-btn"
                        onClick={() => {
                          if (newCategory.trim()) {
                            setCategories(prev => [...prev, newCategory.trim()]);
                            setNewCategory('');
                          }
                        }}
                      >Add</button>
                    </div>
                  </div>
                )}

                {/* SECURITY */}
                {activeTab === 'security' && (
                  <>
                    <div className="admin-settings-card">
                      <h2>Authentication</h2>
                      <ToggleRow label="Two-Factor Authentication" desc="Require 2FA for admin accounts"
                        checked={security.two_factor}
                        onChange={e => setSecurity(p => ({ ...p, two_factor: e.target.checked }))} />
                      <div className="admin-settings-form-group" style={{ marginTop: '16px' }}>
                        <label>Session Timeout (minutes)</label>
                        <input type="number" value={security.session_timeout}
                          onChange={e => setSecurity(p => ({ ...p, session_timeout: e.target.value }))}
                          className="admin-settings-input" style={{ maxWidth: '120px' }} />
                      </div>
                    </div>
                    <div className="admin-settings-card">
                      <h2>Password Policy</h2>
                      <div className="admin-settings-form-group">
                        <label>Minimum Password Length</label>
                        <input type="number" value={security.password_min_length}
                          onChange={e => setSecurity(p => ({ ...p, password_min_length: e.target.value }))}
                          className="admin-settings-input" style={{ maxWidth: '120px' }} />
                      </div>
                      <div className="admin-settings-form-group">
                        <label>Max Login Attempts Before Lockout</label>
                        <input type="number" value={security.max_login_attempts}
                          onChange={e => setSecurity(p => ({ ...p, max_login_attempts: e.target.value }))}
                          className="admin-settings-input" style={{ maxWidth: '120px' }} />
                      </div>
                    </div>
                  </>
                )}

                {/* PRIVACY */}
                {activeTab === 'privacy' && (
                  <>
                    <div className="admin-settings-card">
                      <h2>Data Retention</h2>
                      <div className="admin-settings-form-group">
                        <label>Data Retention Period (days)</label>
                        <input type="number" value={privacy.data_retention_days}
                          onChange={e => setPrivacy(p => ({ ...p, data_retention_days: e.target.value }))}
                          className="admin-settings-input" style={{ maxWidth: '150px' }} />
                      </div>
                    </div>
                    <div className="admin-settings-card">
                      <h2>Privacy Options</h2>
                      <ToggleRow label="Allow Analytics" desc="Collect anonymous usage analytics"
                        checked={privacy.allow_analytics}
                        onChange={e => setPrivacy(p => ({ ...p, allow_analytics: e.target.checked }))} />
                      <ToggleRow label="Anonymise Data Exports" desc="Remove personal data from CSV exports"
                        checked={privacy.anonymise_exports}
                        onChange={e => setPrivacy(p => ({ ...p, anonymise_exports: e.target.checked }))} />
                      <ToggleRow label="GDPR Mode" desc="Enable full GDPR compliance features"
                        checked={privacy.gdpr_mode}
                        onChange={e => setPrivacy(p => ({ ...p, gdpr_mode: e.target.checked }))} />
                    </div>
                  </>
                )}

                <div className="admin-settings-form-actions">
                  <button type="submit" className="admin-settings-save-btn">Save Changes</button>
                  <button type="button" className="admin-settings-reset-btn">Reset to Defaults</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;