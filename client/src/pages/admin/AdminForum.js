import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import {
  MdForum, MdDelete, MdLock, MdLockOpen, MdPushPin,
  MdFlag, MdOutlineFlag, MdSearch, MdCheckCircle,
  MdClose, MdPerson, MdAccessTime, MdVisibility
} from 'react-icons/md';

const API = 'http://localhost:5000/api';

const timeAgo = (dateStr) => {
  const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const getCategoryColor = (cat) => {
  const colors = {
    General: '#6b7280', Routes: '#2d7a4f', Safety: '#dc2626',
    Infrastructure: '#2563eb', Events: '#7c3aed', Tips: '#d97706', Other: '#0d9488',
  };
  return colors[cat] || '#6b7280';
};

// Reaction display component (read-only for admin)
const ReactionSummary = ({ reactions }) => {
  if (!reactions || (!(reactions.helpful > 0) && !(reactions.agree > 0))) return null;
  return (
    <div className="admin-reaction-summary">
      {reactions.helpful > 0 && (
        <span className="admin-reaction-pill helpful">
          👍 {reactions.helpful} Helpful
        </span>
      )}
      {reactions.agree > 0 && (
        <span className="admin-reaction-pill agree">
          ❤️ {reactions.agree} Agree
        </span>
      )}
    </div>
  );
};

const AdminForum = () => {
  const [posts, setPosts] = useState([]);
  const [flagged, setFlagged] = useState({ posts: [], replies: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [viewPost, setViewPost] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [postsRes, flaggedRes] = await Promise.all([
        fetch(`${API}/admin/forum`, { headers }),
        fetch(`${API}/admin/forum/flagged`, { headers }),
      ]);
      const postsData = await postsRes.json();
      const flaggedData = await flaggedRes.json();
      setPosts(Array.isArray(postsData) ? postsData : []);
      setFlagged(flaggedData || { posts: [], replies: [] });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const showMsg = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3000);
  };

  const doAction = async (url, method = 'PUT') => {
    try {
      const res = await fetch(url, { method, headers });
      const data = await res.json();
      showMsg(data.message || 'Done');
      fetchAll();
      if (viewPost) openViewModal(viewPost.id);
    } catch { showMsg('Action failed'); }
  };

  const openViewModal = async (postId) => {
    setViewLoading(true);
    setViewPost({ id: postId, loading: true });
    try {
      const res = await fetch(`${API}/forum/${postId}`, { headers });
      const data = await res.json();
      setViewPost(data);
    } catch {
      setViewPost(null);
    } finally {
      setViewLoading(false);
    }
  };

  const handleDelete = (postId) => {
    if (!window.confirm('Delete this post and all replies? Cannot be undone.')) return;
    doAction(`${API}/admin/forum/${postId}`, 'DELETE');
    setViewPost(null);
  };

  const handleDeleteReply = (postId, replyId) => {
    if (!window.confirm('Delete this reply?')) return;
    doAction(`${API}/admin/forum/${postId}/replies/${replyId}`, 'DELETE');
  };

  const handleLock  = (id) => doAction(`${API}/admin/forum/${id}/lock`);
  const handlePin   = (id) => doAction(`${API}/admin/forum/${id}/pin`);
  const handleUnflagPost  = (id) => doAction(`${API}/admin/forum/${id}/unflag`);
  const handleUnflagReply = (postId, replyId) =>
    doAction(`${API}/admin/forum/${postId}/replies/${replyId}/unflag`);

  const filtered = posts.filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  const flaggedCount = (flagged.posts?.length || 0) + (flagged.replies?.length || 0);

  if (loading) return (
    <AdminLayout>
      <div className="admin-loading">
        <div className="admin-loading-spinner" />Loading forum...
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="admin-page admin-forum-page">

        <div className="admin-dash-header">
          <div>
            <h1>Forum Moderation</h1>
            <p className="admin-page-sub">Manage posts, lock threads, pin announcements, and review flagged content</p>
          </div>
        </div>

        {/* Stats */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-info">
              <span className="admin-stat-label">Total Posts</span>
              <span className="admin-stat-number">{posts.length}</span>
            </div>
            <div className="admin-stat-icon blue"><MdForum size={22} color="#2563eb" /></div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-info">
              <span className="admin-stat-label">Pinned</span>
              <span className="admin-stat-number">{posts.filter(p => p.is_pinned).length}</span>
            </div>
            <div className="admin-stat-icon green"><MdPushPin size={22} color="#2d7a4f" /></div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-info">
              <span className="admin-stat-label">Locked</span>
              <span className="admin-stat-number">{posts.filter(p => p.is_locked).length}</span>
            </div>
            <div className="admin-stat-icon orange"><MdLock size={22} color="#f97316" /></div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-info">
              <span className="admin-stat-label">Flagged</span>
              <span className="admin-stat-number" style={{ color: flaggedCount > 0 ? '#dc2626' : undefined }}>
                {flaggedCount}
              </span>
              {flaggedCount > 0 && <span className="admin-stat-sub" style={{ color: '#dc2626' }}>Needs review</span>}
            </div>
            <div className="admin-stat-icon" style={{ background: '#fee2e2' }}>
              <MdFlag size={22} color="#dc2626" />
            </div>
          </div>
        </div>

        {actionMsg && (
          <div className="admin-success" style={{ marginBottom: 16 }}>
            <MdCheckCircle size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            {actionMsg}
          </div>
        )}

        {/* Tabs */}
        <div className="admin-forum-tabs">
          <button className={activeTab === 'all' ? 'active' : ''} onClick={() => setActiveTab('all')}>
            All Posts ({posts.length})
          </button>
          <button className={activeTab === 'flagged' ? 'active' : ''} onClick={() => setActiveTab('flagged')}>
            🚩 Flagged ({flaggedCount})
            {flaggedCount > 0 && <span className="admin-forum-flag-dot" />}
          </button>
        </div>

        {/* ALL POSTS TAB */}
        {activeTab === 'all' && (
          <>
            <div className="admin-forum-search-wrap">
              <MdSearch size={18} color="#aaa" />
              <input
                type="text"
                placeholder="Search by title, author, email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="admin-forum-search"
              />
            </div>

            <div className="admin-users-table-card">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>Post</th>
                    <th>Author</th>
                    <th>Category</th>
                    <th>Replies</th>
                    <th>Status</th>
                    <th>Posted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="admin-users-empty">No posts found.</td></tr>
                  )}
                  {filtered.map(post => (
                    <tr key={post.id}>
                      <td>
                        <div className="admin-forum-title-cell">
                          {post.is_flagged ? <MdFlag size={14} color="#dc2626" /> : null}
                          <span
                            className="admin-forum-title admin-forum-title-link"
                            onClick={() => openViewModal(post.id)}
                            title="Click to view post"
                          >
                            {post.title}
                          </span>
                        </div>
                      </td>
                      <td>
                        <strong style={{ fontSize: 13, display: 'block' }}>{post.full_name || '—'}</strong>
                        <span className="admin-users-email">{post.email}</span>
                      </td>
                      <td>
                        <span
                          className="admin-forum-category"
                          style={{
                            background: getCategoryColor(post.category) + '22',
                            color: getCategoryColor(post.category)
                          }}
                        >
                          {post.category}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{post.reply_count || 0}</td>
                      <td>
                        <div className="admin-forum-status-badges">
                          {post.is_pinned ? <span className="admin-forum-badge pin">Pinned</span> : null}
                          {post.is_locked ? <span className="admin-forum-badge lock">Locked</span> : null}
                          {!post.is_pinned && !post.is_locked
                            ? <span className="admin-forum-badge normal">Active</span>
                            : null}
                        </div>
                      </td>
                      <td style={{ color: '#888', fontSize: 13 }}>{timeAgo(post.created_at)}</td>
                      <td>
                        <div className="admin-forum-actions">
                          <button
                            className="admin-forum-action-btn"
                            onClick={() => openViewModal(post.id)}
                            title="View post"
                          ><MdVisibility size={15} /></button>
                          <button
                            className={`admin-forum-action-btn ${post.is_pinned ? 'active-green' : ''}`}
                            onClick={() => handlePin(post.id)}
                            title={post.is_pinned ? 'Unpin' : 'Pin'}
                          ><MdPushPin size={15} /></button>
                          <button
                            className={`admin-forum-action-btn ${post.is_locked ? 'active-orange' : ''}`}
                            onClick={() => handleLock(post.id)}
                            title={post.is_locked ? 'Unlock' : 'Lock'}
                          >{post.is_locked ? <MdLockOpen size={15} /> : <MdLock size={15} />}</button>
                          <button
                            className="admin-forum-action-btn delete"
                            onClick={() => handleDelete(post.id)}
                            title="Delete post"
                          ><MdDelete size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* FLAGGED TAB */}
        {activeTab === 'flagged' && (
          <div className="admin-forum-flagged">
            {flaggedCount === 0 && (
              <div className="admin-forum-flagged-empty">
                <MdCheckCircle size={48} color="#2d7a4f" />
                <h3>All clear!</h3>
                <p>No flagged content to review.</p>
              </div>
            )}

            {flagged.posts?.length > 0 && (
              <div className="admin-card" style={{ marginBottom: 20 }}>
                <div className="admin-card-header">
                  <h2><MdFlag size={16} color="#dc2626" style={{ marginRight: 6, verticalAlign: 'middle' }} />
                    Flagged Posts ({flagged.posts.length})</h2>
                </div>
                <div className="admin-forum-flagged-list">
                  {flagged.posts.map(post => (
                    <div key={post.id} className="admin-forum-flagged-item">
                      <div className="admin-forum-flagged-content">
                        <div className="admin-forum-flagged-header">
                          <span
                            className="admin-forum-flagged-title admin-forum-title-link"
                            onClick={() => openViewModal(post.id)}
                          >
                            {post.title}
                          </span>
                          <span className="admin-forum-flagged-meta">
                            by {post.full_name} · {post.email} · {timeAgo(post.created_at)}
                          </span>
                        </div>
                        <p className="admin-forum-flagged-preview">
                          {post.content?.length > 150 ? post.content.substring(0, 150) + '...' : post.content}
                        </p>
                      </div>
                      <div className="admin-forum-flagged-actions">
                        <button className="admin-forum-dismiss-btn" onClick={() => handleUnflagPost(post.id)}>
                          <MdOutlineFlag size={15} /> Dismiss
                        </button>
                        <button className="admin-forum-remove-btn" onClick={() => handleDelete(post.id)}>
                          <MdDelete size={15} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {flagged.replies?.length > 0 && (
              <div className="admin-card">
                <div className="admin-card-header">
                  <h2><MdFlag size={16} color="#dc2626" style={{ marginRight: 6, verticalAlign: 'middle' }} />
                    Flagged Replies ({flagged.replies.length})</h2>
                </div>
                <div className="admin-forum-flagged-list">
                  {flagged.replies.map(reply => (
                    <div key={reply.id} className="admin-forum-flagged-item">
                      <div className="admin-forum-flagged-content">
                        <div className="admin-forum-flagged-header">
                          <span className="admin-forum-flagged-title">
                            Reply on: <em>{reply.post_title}</em>
                          </span>
                          <span className="admin-forum-flagged-meta">
                            by {reply.full_name} · {reply.email} · {timeAgo(reply.created_at)}
                          </span>
                        </div>
                        <p className="admin-forum-flagged-preview">{reply.content}</p>
                      </div>
                      <div className="admin-forum-flagged-actions">
                        <button className="admin-forum-dismiss-btn"
                          onClick={() => handleUnflagReply(reply.post_id, reply.id)}>
                          <MdOutlineFlag size={15} /> Dismiss
                        </button>
                        <button className="admin-forum-remove-btn"
                          onClick={() => handleDeleteReply(reply.post_id, reply.id)}>
                          <MdDelete size={15} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* VIEW POST MODAL */}
      {viewPost && (
        <div className="admin-modal-overlay" onClick={() => setViewPost(null)}>
          <div className="admin-forum-view-modal" onClick={e => e.stopPropagation()}>

            <div className="admin-forum-view-header">
              <div className="admin-forum-view-header-left">
                <span
                  className="admin-forum-category"
                  style={{
                    background: getCategoryColor(viewPost.category) + '22',
                    color: getCategoryColor(viewPost.category)
                  }}
                >
                  {viewPost.category}
                </span>
                {viewPost.is_pinned ? <span className="admin-forum-badge pin">Pinned</span> : null}
                {viewPost.is_locked ? <span className="admin-forum-badge lock">Locked</span> : null}
              </div>
              <div className="admin-forum-view-header-actions">
                <button
                  className={`admin-forum-action-btn ${viewPost.is_pinned ? 'active-green' : ''}`}
                  onClick={() => handlePin(viewPost.id)}
                  title={viewPost.is_pinned ? 'Unpin' : 'Pin'}
                ><MdPushPin size={15} /></button>
                <button
                  className={`admin-forum-action-btn ${viewPost.is_locked ? 'active-orange' : ''}`}
                  onClick={() => handleLock(viewPost.id)}
                  title={viewPost.is_locked ? 'Unlock' : 'Lock'}
                >{viewPost.is_locked ? <MdLockOpen size={15} /> : <MdLock size={15} />}</button>
                <button
                  className="admin-forum-action-btn delete"
                  onClick={() => handleDelete(viewPost.id)}
                  title="Delete post"
                ><MdDelete size={15} /></button>
                <button
                  className="admin-forum-action-btn"
                  onClick={() => setViewPost(null)}
                  title="Close"
                ><MdClose size={15} /></button>
              </div>
            </div>

            <div className="admin-forum-view-body">
              {viewLoading ? (
                <div className="admin-loading" style={{ padding: 40 }}>
                  <div className="admin-loading-spinner" /> Loading...
                </div>
              ) : (
                <>
                  <h2 className="admin-forum-view-title">{viewPost.title}</h2>
                  <div className="admin-forum-view-meta">
                    <span><MdPerson size={14} /> {viewPost.full_name || 'Anonymous'}</span>
                    <span><MdAccessTime size={14} /> {timeAgo(viewPost.created_at)}</span>
                  </div>
                  <div className="admin-forum-view-content">{viewPost.content}</div>

                  {/* Post reactions */}
                  <ReactionSummary reactions={viewPost.reactions} />

                  <div className="admin-forum-view-replies-header">
                    <h3>{viewPost.replies?.length || 0} {viewPost.replies?.length === 1 ? 'Reply' : 'Replies'}</h3>
                  </div>

                  {viewPost.replies?.length === 0 && (
                    <p className="admin-forum-view-no-replies">No replies yet.</p>
                  )}

                  {viewPost.replies?.map(r => (
                    <div key={r.id} className={`admin-forum-view-reply ${r.is_flagged ? 'flagged' : ''}`}>
                      <div className="admin-forum-view-reply-header">
                        <div className="admin-forum-view-meta">
                          <span><MdPerson size={13} /> {r.full_name || 'Anonymous'}</span>
                          <span><MdAccessTime size={13} /> {timeAgo(r.created_at)}</span>
                          {r.is_flagged
                            ? <span className="admin-forum-badge" style={{ background: '#fef3c7', color: '#d97706', fontSize: 11 }}>
                                🚩 Flagged
                              </span>
                            : null}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {r.is_flagged && (
                            <button
                              className="admin-forum-dismiss-btn"
                              style={{ padding: '4px 10px', fontSize: 12 }}
                              onClick={() => handleUnflagReply(viewPost.id, r.id)}
                            >
                              <MdOutlineFlag size={13} /> Dismiss
                            </button>
                          )}
                          <button
                            className="admin-forum-action-btn delete"
                            onClick={() => handleDeleteReply(viewPost.id, r.id)}
                            title="Delete reply"
                          ><MdDelete size={14} /></button>
                        </div>
                      </div>
                      <p className="admin-forum-view-reply-content">{r.content}</p>

                      {/* Reply reactions */}
                      <ReactionSummary reactions={r.reactions} />
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
};

export default AdminForum;