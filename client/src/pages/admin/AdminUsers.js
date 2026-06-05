import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { getAdminUsers, updateUserRole, deleteAdminUser } from '../../services/api';
import { MdDelete, MdEdit, MdFilterList, MdPersonAdd, MdClose, MdEmail, MdLock, MdPerson } from 'react-icons/md';
import api from '../../services/api';

const USERS_PER_PAGE = 10;

const avatarColors = [
  { bg: '#e8f5ee', color: '#2d7a4f' },
  { bg: '#eff6ff', color: '#2563eb' },
  { bg: '#fef9c3', color: '#ca8a04' },
  { bg: '#fff7ed', color: '#f97316' },
  { bg: '#f5f3ff', color: '#7c3aed' },
  { bg: '#fce7f3', color: '#db2777' },
];

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('users');
  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [newUser, setNewUser] = useState({
    full_name: '', email: '', password: '', role: 'user'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await getAdminUsers();
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Change ${user.full_name || user.email}'s role to ${newRole}?`)) return;
    try {
      await updateUserRole(user.id, { role: newRole });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user ${user.full_name || user.email}? This cannot be undone.`)) return;
    try {
      await deleteAdminUser(user.id);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.full_name || !newUser.email || !newUser.password) {
      setModalError('All fields are required.');
      return;
    }
    setSubmitting(true);
    setModalError('');
    try {
      await api.post('/auth/register', {
        full_name: newUser.full_name,
        email: newUser.email,
        password: newUser.password,
      });

      if (newUser.role === 'admin') {
        const res = await getAdminUsers();
        const created = res.data.find(u => u.email === newUser.email);
        if (created) {
          await updateUserRole(created.id, { role: 'admin' });
        }
      }

      setModalSuccess('User created successfully!');
      fetchUsers();
      setTimeout(() => {
        setShowModal(false);
        setModalSuccess('');
        setNewUser({ full_name: '', email: '', password: '', role: 'user' });
      }, 1500);
    } catch (err) {
      setModalError(err.response?.data?.error || 'Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (user) => {
    if (user.full_name) {
      return user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user.email[0].toUpperCase();
  };

  const getAvatarColor = (user) => {
    const index = (user.id || 0) % avatarColors.length;
    return avatarColors[index];
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  // Top contributors — sort by report_count descending, take top 10
  const topContributors = [...users]
    .filter(u => u.report_count > 0)
    .sort((a, b) => b.report_count - a.report_count)
    .slice(0, 10);

  const maxReports = topContributors[0]?.report_count || 1;

  const getMedalColor = (index) => {
    if (index === 0) return { bg: '#fef9c3', color: '#ca8a04', medal: '🥇' };
    if (index === 1) return { bg: '#f1f5f9', color: '#64748b', medal: '🥈' };
    if (index === 2) return { bg: '#fff7ed', color: '#f97316', medal: '🥉' };
    return { bg: '#f8f9fa', color: '#888', medal: `#${index + 1}` };
  };

  const filtered = users.filter(u =>
    (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / USERS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * USERS_PER_PAGE, page * USERS_PER_PAGE);
  const totalUsers = users.length;
  const totalAdmins = users.filter(u => u.role === 'admin').length;
  const regularUsers = totalUsers - totalAdmins;

  if (loading) return (
    <AdminLayout>
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        Loading users...
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="admin-page admin-users-page">
        <h1>Users Management</h1>
        <p className="admin-page-sub">Manage registered users and their permissions</p>

        {/* Stats */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-info">
              <span className="admin-stat-label">Total Users</span>
              <span className="admin-stat-number">{totalUsers}</span>
              <span className="admin-stat-sub green">↑ All time</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-info">
              <span className="admin-stat-label">Active Users</span>
              <span className="admin-stat-number">{regularUsers}</span>
              <span className="admin-stat-sub">
                {totalUsers > 0 ? Math.round((regularUsers / totalUsers) * 100) : 0}% of total
              </span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-info">
              <span className="admin-stat-label">New This Week</span>
              <span className="admin-stat-number">
                {users.filter(u => {
                  const d = new Date(u.created_at);
                  const now = new Date();
                  return (now - d) / (1000 * 60 * 60 * 24) <= 7;
                }).length}
              </span>
              <span className="admin-stat-sub green">↑ This week</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-info">
              <span className="admin-stat-label">Admins</span>
              <span className="admin-stat-number">{totalAdmins}</span>
              <span className="admin-stat-sub">
                {totalUsers > 0 ? ((totalAdmins / totalUsers) * 100).toFixed(1) : 0}% of total
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="admin-forum-tabs" style={{ marginBottom: 20 }}>
          <button
            className={activeTab === 'users' ? 'active' : ''}
            onClick={() => setActiveTab('users')}
          >
            All Users ({users.length})
          </button>
          <button
            className={activeTab === 'leaderboard' ? 'active' : ''}
            onClick={() => setActiveTab('leaderboard')}
          >
            🏆 Top Contributors
          </button>
        </div>

        {/* LEADERBOARD TAB */}
        {activeTab === 'leaderboard' && (
          <div className="admin-leaderboard">
            {topContributors.length === 0 ? (
              <div className="admin-users-table-card" style={{ padding: 48, textAlign: 'center', color: '#aaa' }}>
                No reports submitted yet.
              </div>
            ) : (
              <>
                {/* Top 3 podium */}
                <div className="admin-podium">
                  {topContributors.slice(0, 3).map((user, index) => {
                    const medal = getMedalColor(index);
                    const avatar = getAvatarColor(user);
                    return (
                      <div key={user.id} className={`admin-podium-card rank-${index + 1}`}>
                        <div className="admin-podium-medal">{medal.medal}</div>
                        <div
                          className="admin-podium-avatar"
                          style={{ background: avatar.bg, color: avatar.color }}
                        >
                          {getInitials(user)}
                        </div>
                        <div className="admin-podium-name">{user.full_name || user.email}</div>
                        <div className="admin-podium-email">{user.email}</div>
                        <div className="admin-podium-count">
                          <span className="admin-podium-num">{user.report_count}</span>
                          <span className="admin-podium-label">reports</span>
                        </div>
                        <span className={`admin-users-role ${user.role === 'admin' ? 'role-admin' : 'role-user'}`}>
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Full leaderboard table */}
                <div className="admin-users-table-card">
                  <table className="admin-users-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>User</th>
                        <th>Reports</th>
                        <th>Contribution</th>
                        <th>Joined</th>
                        <th>Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topContributors.map((user, index) => {
                        const medal = getMedalColor(index);
                        const avatar = getAvatarColor(user);
                        const pct = Math.round((user.report_count / maxReports) * 100);
                        return (
                          <tr key={user.id}>
                            <td>
                              <div
                                className="admin-leaderboard-rank"
                                style={{ background: medal.bg, color: medal.color }}
                              >
                                {index < 3 ? medal.medal : `#${index + 1}`}
                              </div>
                            </td>
                            <td>
                              <div className="admin-users-cell">
                                <div
                                  className="admin-users-avatar"
                                  style={{ background: avatar.bg, color: avatar.color }}
                                >
                                  {getInitials(user)}
                                </div>
                                <div>
                                  <strong>{user.full_name || '—'}</strong>
                                  <span className="admin-users-email">{user.email}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="admin-leaderboard-count">{user.report_count}</span>
                            </td>
                            <td style={{ minWidth: 160 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div className="admin-analytics-progress-track" style={{ flex: 1 }}>
                                  <div
                                    className="admin-analytics-progress-fill"
                                    style={{ width: `${pct}%`, background: '#2d7a4f' }}
                                  />
                                </div>
                                <span style={{ fontSize: 12, color: '#888', minWidth: 34 }}>{pct}%</span>
                              </div>
                            </td>
                            <td className="admin-users-date">{formatDate(user.created_at)}</td>
                            <td>
                              <span className={`admin-users-role ${user.role === 'admin' ? 'role-admin' : 'role-user'}`}>
                                {user.role === 'admin' ? 'Admin' : 'User'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <>
            <div className="admin-users-toolbar">
              <input
                type="text"
                placeholder="Search by name, email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="admin-users-search"
              />
              <button className="admin-users-filter-btn">
                <MdFilterList size={18} /> Filter
              </button>
              <button className="admin-users-add-btn" onClick={() => setShowModal(true)}>
                <MdPersonAdd size={18} /> + Add User
              </button>
            </div>

            <div className="admin-users-table-card">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Reports</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={6} className="admin-users-empty">No users found.</td>
                    </tr>
                  )}
                  {paginated.map(user => {
                    const avatar = getAvatarColor(user);
                    return (
                      <tr key={user.id}>
                        <td>
                          <div className="admin-users-cell">
                            <div
                              className="admin-users-avatar"
                              style={{ background: avatar.bg, color: avatar.color }}
                            >
                              {getInitials(user)}
                            </div>
                            <div>
                              <strong>{user.full_name || '—'}</strong>
                              <span className="admin-users-email">{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`admin-users-role ${user.role === 'admin' ? 'role-admin' : 'role-user'}`}>
                            {user.role === 'admin' ? 'Admin' : 'User'}
                          </span>
                        </td>
                        <td className="admin-users-reports">{user.report_count || 0}</td>
                        <td className="admin-users-date">{formatDate(user.created_at)}</td>
                        <td>
                          <span className="admin-users-status active">Active</span>
                        </td>
                        <td>
                          <div className="admin-users-actions">
                            <button
                              className="admin-users-action-btn"
                              onClick={() => handleRoleToggle(user)}
                              title={user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                            >
                              <MdEdit size={15} />
                            </button>
                            {user.role !== 'admin' && (
                              <button
                                className="admin-users-action-btn delete"
                                onClick={() => handleDelete(user)}
                                title="Delete user"
                              >
                                <MdDelete size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="admin-users-footer">
              <span>
                Showing {filtered.length === 0 ? 0 : (page - 1) * USERS_PER_PAGE + 1}–{Math.min(page * USERS_PER_PAGE, filtered.length)} of {filtered.length} users
              </span>
              <div className="admin-users-pagination">
                <button
                  className="admin-users-page-btn"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    className={`admin-users-page-num ${page === p ? 'active' : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className="admin-users-page-btn"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || totalPages === 0}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Add New User</h2>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}>
                <MdClose size={22} />
              </button>
            </div>

            {modalSuccess && <div className="admin-success">{modalSuccess}</div>}
            {modalError && <div className="admin-error">{modalError}</div>}

            <form onSubmit={handleAddUser}>
              <div className="admin-modal-form-group">
                <label>Full Name</label>
                <div className="admin-modal-input-wrap">
                  <MdPerson size={18} className="admin-modal-input-icon" />
                  <input
                    type="text"
                    placeholder="Sarah Johnson"
                    value={newUser.full_name}
                    onChange={e => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="admin-modal-form-group">
                <label>Email Address</label>
                <div className="admin-modal-input-wrap">
                  <MdEmail size={18} className="admin-modal-input-icon" />
                  <input
                    type="email"
                    placeholder="sarah@example.com"
                    value={newUser.email}
                    onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="admin-modal-form-group">
                <label>Password</label>
                <div className="admin-modal-input-wrap">
                  <MdLock size={18} className="admin-modal-input-icon" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newUser.password}
                    onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>
              </div>
              <div className="admin-modal-form-group">
                <label>Role</label>
                <select
                  value={newUser.role}
                  onChange={e => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                  className="admin-modal-select"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="admin-modal-actions">
                <button type="button" className="admin-modal-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-modal-submit" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminUsers;