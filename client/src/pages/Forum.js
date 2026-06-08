import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import { getForumPosts } from '../services/api';
import {
  MdForum, MdAdd, MdClose, MdChat, MdPerson,
  MdAccessTime, MdPushPin, MdLock, MdImage, MdAttachFile,
  MdEvent
} from 'react-icons/md';
import './Forum.css';

const categories = ['General', 'Routes', 'Safety', 'Infrastructure', 'Events', 'Tips', 'Other'];
const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const timeAgo = (dateStr) => {
  const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const Forum = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [pollCounts, setPollCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({ title: '', content: '', category: 'General' });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPosts = async () => {
    try {
      const res = await getForumPosts();
      const allPosts = res.data;
      setPosts(allPosts);

      // Fetch poll counts for Events posts only
      const eventPosts = allPosts.filter(p => p.category === 'Events');
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const pollResults = await Promise.all(
        eventPosts.map(p =>
          fetch(`${API}/forum/${p.id}/poll`, { headers })
            .then(r => r.json())
            .then(data => ({ id: p.id, ...data }))
            .catch(() => ({ id: p.id, count: 0, voted: false }))
        )
      );

      const counts = {};
      pollResults.forEach(({ id, count, voted }) => { counts[id] = { count, voted }; });
      setPollCounts(counts);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 3) {
      setError('Maximum 3 images allowed.');
      return;
    }
    setError('');
    setImages(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      setError('Title and content are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('content', formData.content);
      fd.append('category', formData.category);
      images.forEach(img => fd.append('images', img));

      const res = await fetch(`${API}/forum`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setShowModal(false);
      setFormData({ title: '', content: '', category: 'General' });
      setImages([]);
      setImagePreviews([]);
      navigate(`/forum/${data.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create post.');
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({ title: '', content: '', category: 'General' });
    setImages([]);
    setImagePreviews([]);
    setError('');
  };

  const filtered = posts.filter(p => {
    const matchCat = activeCategory === 'All' || p.category === activeCategory;
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const getCategoryColor = (cat) => {
    const colors = {
      General: '#6b7280', Routes: '#2d7a4f', Safety: '#dc2626',
      Infrastructure: '#2563eb', Events: '#7c3aed', Tips: '#d97706', Other: '#0d9488',
    };
    return colors[cat] || '#6b7280';
  };

  if (loading) return <div><Navbar /><div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div></div>;

  return (
    <div className="forum-page">
      <Navbar />
      <section className="forum-hero">
        <div className="forum-hero-icon"><MdForum size={32} color="white" /></div>
        <h1>Community Forum</h1>
        <p>Discuss cycling routes, share tips, and connect with fellow cyclists in Birmingham.</p>
      </section>

      <div className="forum-main">
        <div className="forum-toolbar">
          <input
            type="text"
            placeholder="Search discussions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="forum-search"
          />
          {user ? (
            <button className="forum-new-btn" onClick={() => setShowModal(true)}>
              <MdAdd size={20} /> New Discussion
            </button>
          ) : (
            <Link to="/login" className="forum-new-btn">
              <MdAdd size={20} /> Sign in to Post
            </Link>
          )}
        </div>

        <div className="forum-categories">
          {['All', ...categories].map(cat => (
            <button
              key={cat}
              className={`forum-cat-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >{cat}</button>
          ))}
        </div>

        <div className="forum-posts">
          {filtered.length === 0 ? (
            <div className="empty-state forum-empty-state">
              <div className="empty-state-icon">💬</div>
              <h3>
                {search || activeCategory !== 'All'
                  ? 'No discussions found'
                  : 'Be the first to start a discussion!'}
              </h3>
              <p>
                {search
                  ? `No posts match "${search}". Try different keywords.`
                  : activeCategory !== 'All'
                  ? `No discussions in the ${activeCategory} category yet.`
                  : 'Share your cycling experiences, ask questions, and connect with fellow Birmingham cyclists.'}
              </p>
              {user ? (
                <button className="empty-state-btn" onClick={() => setShowModal(true)}>
                  + Start a Discussion
                </button>
              ) : (
                <Link to="/login" className="empty-state-btn">Sign in to Post</Link>
              )}
            </div>
          ) : (
            filtered.map(post => {
              const poll = pollCounts[post.id];
              return (
                <Link
                  to={`/forum/${post.id}`}
                  key={post.id}
                  className={`forum-post-card ${post.is_pinned ? 'pinned' : ''} ${post.is_locked ? 'locked' : ''}`}
                >
                  <div className="forum-post-main">
                    <div className="forum-post-header">
                      <div className="forum-post-header-left">
                        <span className="forum-post-category" style={{ background: getCategoryColor(post.category) }}>
                          {post.category}
                        </span>
                        {!!post.is_pinned && <span className="forum-post-status-icon pinned"><MdPushPin size={14} /></span>}
                        {!!post.is_locked && <span className="forum-post-status-icon locked"><MdLock size={14} /></span>}
                      </div>
                      <h3>{post.title}</h3>
                    </div>
                    <p className="forum-post-preview">
                      {post.content.length > 120 ? post.content.substring(0, 120) + '...' : post.content}
                    </p>
                    <div className="forum-post-meta">
                      <span><MdPerson size={14} /> {post.full_name || 'Anonymous'}</span>
                      <span><MdAccessTime size={14} /> {timeAgo(post.created_at)}</span>
                      <span><MdChat size={14} /> {post.reply_count} {post.reply_count === 1 ? 'reply' : 'replies'}</span>
                      {post.images && <span><MdImage size={14} /> Photos</span>}
                      {post.category === 'Events' && poll && (
                        <span className="forum-poll-meta">
                          <MdEvent size={14} /> {poll.count} {poll.count === 1 ? 'going' : 'going'}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {showModal && (
        <div className="forum-modal-overlay" onClick={closeModal}>
          <div className="forum-modal" onClick={(e) => e.stopPropagation()}>
            <div className="forum-modal-header">
              <h2>New Discussion</h2>
              <button onClick={closeModal}><MdClose size={22} /></button>
            </div>
            {error && <div className="forum-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="forum-form-group">
                <label>Title</label>
                <input
                  type="text"
                  placeholder="What would you like to discuss?"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  autoComplete="off"
                />
              </div>
              <div className="forum-form-group">
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="forum-form-group">
                <label>Content</label>
                <textarea
                  placeholder="Share your thoughts..."
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={5}
                />
              </div>
              <div className="forum-form-group">
                <label>Photos <span style={{ color: '#aaa', fontWeight: 400 }}>(optional, max 3)</span></label>
                {imagePreviews.length > 0 && (
                  <div className="forum-image-previews">
                    {imagePreviews.map((src, i) => (
                      <div key={i} className="forum-image-preview-wrap">
                        <img src={src} alt={`preview ${i}`} className="forum-image-preview" />
                        <button type="button" className="forum-image-remove" onClick={() => removeImage(i)}>
                          <MdClose size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {images.length < 3 && (
                  <label className="forum-image-upload-btn">
                    <MdAttachFile size={18} /> Add Photos
                    <input type="file" accept="image/*" multiple onChange={handleImageChange} style={{ display: 'none' }} />
                  </label>
                )}
              </div>
              <div className="forum-modal-actions">
                <button type="button" className="forum-cancel-btn" onClick={closeModal}>Cancel</button>
                <button type="submit" className="forum-submit-btn" disabled={submitting}>
                  {submitting ? 'Posting...' : 'Post Discussion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forum;
