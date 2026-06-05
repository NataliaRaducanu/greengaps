import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import api, { getForumPost, deleteForumPost, deleteForumReply } from '../services/api';
import {
  MdArrowBack, MdPerson, MdAccessTime, MdDelete,
  MdSend, MdClose, MdAttachFile, MdZoomIn, MdOutlineFlag,
  MdShare, MdContentCopy, MdCheck, MdEvent, MdWarning, MdBuild
} from 'react-icons/md';
import './ForumPost.css';

const API = 'http://localhost:5000/api';
const BASE = 'http://localhost:5000';

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
    Infrastructure: '#2563eb', Events: '#7c3aed', Tips: '#d97706',
  };
  return colors[cat] || '#6b7280';
};

const parseImages = (images) => {
  if (!images) return [];
  try { return JSON.parse(images); } catch { return []; }
};

// ── Image Gallery ─────────────────────────────────────────────
const ImageGallery = ({ images }) => {
  const [lightbox, setLightbox] = useState(null);
  if (!images || images.length === 0) return null;
  return (
    <>
      <div className="forum-image-gallery">
        {images.map((src, i) => (
          <div key={i} className="forum-gallery-item" onClick={() => setLightbox(src)}>
            <img src={`${BASE}${src}`} alt={`attachment ${i + 1}`} />
            <div className="forum-gallery-zoom"><MdZoomIn size={20} color="white" /></div>
          </div>
        ))}
      </div>
      {lightbox && (
        <div className="forum-lightbox" onClick={() => setLightbox(null)}>
          <button className="forum-lightbox-close"><MdClose size={24} /></button>
          <img src={`${BASE}${lightbox}`} alt="full size" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  );
};

// ── Reaction Bar ──────────────────────────────────────────────
const ReactionBar = ({ reactions, userReactions, onReact, disabled }) => (
  <div className="forum-reactions">
    <button
      className={`forum-reaction-btn ${userReactions?.helpful ? 'reacted' : ''}`}
      onClick={() => onReact('helpful')}
      disabled={disabled}
      title={disabled ? 'Sign in to react' : 'Mark as helpful'}
    >
      👍 <span>Helpful</span>
      {reactions?.helpful > 0 && <span className="forum-reaction-count">{reactions.helpful}</span>}
    </button>
    <button
      className={`forum-reaction-btn agree ${userReactions?.agree ? 'reacted agree-reacted' : ''}`}
      onClick={() => onReact('agree')}
      disabled={disabled}
      title={disabled ? 'Sign in to react' : 'I agree'}
    >
      ❤️ <span>Agree</span>
      {reactions?.agree > 0 && <span className="forum-reaction-count">{reactions.agree}</span>}
    </button>
  </div>
);

// ── Poll / RSVP Block (Events only) ──────────────────────────
const EventPoll = ({ postId, user }) => {
  const navigate = useNavigate();
  const [poll, setPoll] = useState({ count: 0, voted: false });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${API}/forum/${postId}/poll`, { headers })
      .then(r => r.json())
      .then(data => setPoll(data))
      .catch(() => {});
  }, [postId]);

  const handleVote = async () => {
    if (!user) { navigate('/login'); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/forum/${postId}/poll/vote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPoll({ count: data.count, voted: data.voted });
    } catch (err) {
      console.error('Poll vote error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forum-poll-block">
      <div className="forum-poll-header">
        <MdEvent size={18} color="#7c3aed" />
        <span>Are you going?</span>
      </div>
      <div className="forum-poll-body">
        <button
          className={`forum-poll-btn ${poll.voted ? 'voted' : ''}`}
          onClick={handleVote}
          disabled={loading}
        >
          {poll.voted ? "✓ You're going!" : '👍 Count me in'}
        </button>
        <span className="forum-poll-count">
          <strong>{poll.count}</strong> {poll.count === 1 ? 'person going' : 'people going'}
        </span>
      </div>
      {!user && (
        <p className="forum-poll-signin">
          <Link to="/login">Sign in</Link> to RSVP
        </p>
      )}
    </div>
  );
};

// ── Report Nudge (Safety / Infrastructure only) ───────────────
const ReportNudge = ({ category }) => {
  if (!['Safety', 'Infrastructure'].includes(category)) return null;

  const isSafety = category === 'Safety';
  const icon = isSafety ? <MdWarning size={18} color="#dc2626" /> : <MdBuild size={18} color="#2563eb" />;
  const color = isSafety ? '#dc2626' : '#2563eb';
  const bg = isSafety ? '#fef2f2' : '#eff6ff';
  const border = isSafety ? '#fecaca' : '#bfdbfe';

  return (
    <div className="forum-report-nudge" style={{ background: bg, borderColor: border }}>
      <div className="forum-report-nudge-icon">{icon}</div>
      <div className="forum-report-nudge-text">
        <strong style={{ color }}>Is this an infrastructure issue?</strong>
        <p>Forum posts are for discussion. To get this officially logged and actioned by the council, submit a formal report.</p>
      </div>
      <Link to="/map" className="forum-report-nudge-btn" style={{ background: color }}>
        Submit a Report →
      </Link>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────
const ForumPost = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [replyImages, setReplyImages] = useState([]);
  const [replyPreviews, setReplyPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [flagged, setFlagged] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchPost = useCallback(async () => {
    try {
      const res = await getForumPost(id);
      setPost(res.data);
      setFlagged(res.data.is_flagged === 1);
    } catch (err) {
      console.error('Error fetching post:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchPost(); }, [fetchPost]);

  const handleReactPost = async (reaction) => {
    if (!user) { navigate('/login'); return; }
    try {
      const res = await api.post(`/forum/${id}/react`, { reaction });
      const data = res.data;
      setPost(prev => ({
        ...prev,
        reactions: {
          ...prev.reactions,
          [reaction]: data.reacted
            ? (prev.reactions?.[reaction] || 0) + 1
            : Math.max((prev.reactions?.[reaction] || 0) - 1, 0)
        },
        user_reactions: { ...prev.user_reactions, [reaction]: data.reacted }
      }));
    } catch (err) {
      console.error('Reaction error:', err);
    }
  };

  const handleReactReply = async (replyId, reaction) => {
    if (!user) { navigate('/login'); return; }
    try {
      const res = await api.post(`/forum/${id}/replies/${replyId}/react`, { reaction });
      const data = res.data;
      setPost(prev => ({
        ...prev,
        replies: prev.replies.map(r =>
          r.id === replyId ? {
            ...r,
            reactions: {
              ...r.reactions,
              [reaction]: data.reacted
                ? (r.reactions?.[reaction] || 0) + 1
                : Math.max((r.reactions?.[reaction] || 0) - 1, 0)
            },
            user_reactions: { ...r.user_reactions, [reaction]: data.reacted }
          } : r
        )
      }));
    } catch (err) {
      console.error('Reaction error:', err);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
    setShowShareMenu(false);
  };

  const handleShareWhatsApp = () => {
    const url = window.location.href;
    const text = `Check out this discussion on GreenGaps: ${post.title}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    setShowShareMenu(false);
  };

  const handleShareTwitter = () => {
    const url = window.location.href;
    const text = `${post.title} — Join the discussion on GreenGaps #GreenGaps #Birmingham #Cycling`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    setShowShareMenu(false);
  };

  const handleFlagPost = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API}/forum/${id}/flag`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      setFlagged(true);
      fetchPost();
    } catch (err) {
      setError('Failed to report post.');
    }
  };

  const handleFlagReply = async (replyId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API}/forum/${id}/replies/${replyId}/flag`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPost();
    } catch (err) {
      setError('Failed to report reply.');
    }
  };

  const handleReplyImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + replyImages.length > 3) {
      setError('Maximum 3 images per reply.');
      return;
    }
    setError('');
    setReplyImages(prev => [...prev, ...files]);
    setReplyPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removeReplyImage = (index) => {
    setReplyImages(prev => prev.filter((_, i) => i !== index));
    setReplyPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      fd.append('content', reply);
      replyImages.forEach(img => fd.append('images', img));
      const res = await fetch(`${API}/forum/${id}/replies`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReply('');
      setReplyImages([]);
      setReplyPreviews([]);
      fetchPost();
    } catch (err) {
      setError(err.message || 'Failed to post reply.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Delete this post and all its replies?')) return;
    try {
      await deleteForumPost(id);
      navigate('/forum');
    } catch (err) {
      setError('Failed to delete post.');
    }
  };

  const handleDeleteReply = async (replyId) => {
    if (!window.confirm('Delete this reply?')) return;
    try {
      await deleteForumReply(id, replyId);
      fetchPost();
    } catch (err) {
      setError('Failed to delete reply.');
    }
  };

  if (loading) return <div><Navbar /><div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div></div>;
  if (!post) return <div><Navbar /><div style={{ padding: '40px', textAlign: 'center' }}>Post not found.</div></div>;

  const postImages = parseImages(post.images);
  const isAdmin = user?.role === 'admin';
  const isOwner = user?.id === post.user_id;

  return (
    <div className="forum-post-page">
      <Navbar />
      <div className="forum-post-container">

        <Link to="/forum" className="forum-back-btn">
          <MdArrowBack size={18} /> Back to Forum
        </Link>

        <div className="forum-post-card-full">
          <div className="forum-post-card-header">
            <div className="forum-post-card-meta">
              <span className="forum-post-category" style={{ background: getCategoryColor(post.category) }}>
                {post.category}
              </span>
              <h1>{post.title}</h1>
            </div>
            <div className="forum-post-action-btns">
              <div className="share-btn-wrap">
                <button className="forum-share-btn" onClick={() => setShowShareMenu(prev => !prev)}>
                  <MdShare size={16} /> Share
                </button>
                {showShareMenu && (
                  <div className="share-menu">
                    <button className="share-menu-item" onClick={handleCopyLink}>
                      {copied ? <MdCheck size={16} color="#2d7a4f" /> : <MdContentCopy size={16} />}
                      {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                    <button className="share-menu-item whatsapp" onClick={handleShareWhatsApp}>
                      <span>💬</span> WhatsApp
                    </button>
                    <button className="share-menu-item twitter" onClick={handleShareTwitter}>
                      <span>🐦</span> X / Twitter
                    </button>
                  </div>
                )}
              </div>
              {user && !isOwner && !isAdmin && !flagged && (
                <button className="forum-flag-btn" onClick={handleFlagPost}>
                  <MdOutlineFlag size={16} /> Report
                </button>
              )}
              {user && !isOwner && !isAdmin && flagged && (
                <span className="forum-flagged-label">🚩 Reported</span>
              )}
              {isOwner && (
                <button className="forum-delete-btn" onClick={handleDeletePost}>
                  <MdDelete size={18} /> Delete
                </button>
              )}
            </div>
          </div>

          <div className="forum-post-author">
            <div className="forum-avatar">
              {post.profile_picture
                ? <img src={`${BASE}${post.profile_picture}`} alt="avatar" />
                : <MdPerson size={20} color="#2d7a4f" />}
            </div>
            <span>{post.full_name || 'Anonymous'}</span>
            <span className="forum-dot">·</span>
            <MdAccessTime size={14} color="#888" />
            <span className="forum-time">{timeAgo(post.created_at)}</span>
          </div>

          <div className="forum-post-body">{post.content}</div>
          <ImageGallery images={postImages} />

          {/* Poll — Events only */}
          {post.category === 'Events' && (
            <EventPoll postId={post.id} user={user} />
          )}

          {/* Report nudge — Safety / Infrastructure only */}
          <ReportNudge category={post.category} />

          <ReactionBar
            reactions={post.reactions}
            userReactions={post.user_reactions}
            onReact={handleReactPost}
            disabled={!user}
          />
        </div>

        {/* Replies */}
        <div className="forum-replies-section">
          <h2>{post.replies?.length || 0} {post.replies?.length === 1 ? 'Reply' : 'Replies'}</h2>
          {post.replies?.length === 0 && (
            <div className="forum-no-replies">No replies yet. Be the first to respond!</div>
          )}
          {post.replies?.map(r => {
            const rImages = parseImages(r.images);
            const isReplyOwner = user?.id === r.user_id;
            return (
              <div key={r.id} className="forum-reply-card">
                <div className="forum-reply-header">
                  <div className="forum-post-author">
                    <div className="forum-avatar small">
                      {r.profile_picture
                        ? <img src={`${BASE}${r.profile_picture}`} alt="avatar" />
                        : <MdPerson size={16} color="#2d7a4f" />}
                    </div>
                    <span>{r.full_name || 'Anonymous'}</span>
                    <span className="forum-dot">·</span>
                    <MdAccessTime size={13} color="#888" />
                    <span className="forum-time">{timeAgo(r.created_at)}</span>
                  </div>
                  <div className="forum-reply-action-btns">
                    {user && !isReplyOwner && !isAdmin && !r.is_flagged && (
                      <button className="forum-flag-btn small" onClick={() => handleFlagReply(r.id)}>
                        <MdOutlineFlag size={14} />
                      </button>
                    )}
                    {isReplyOwner && (
                      <button className="forum-delete-reply-btn" onClick={() => handleDeleteReply(r.id)}>
                        <MdDelete size={16} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="forum-reply-content">{r.content}</p>
                <ImageGallery images={rImages} />
                <ReactionBar
                  reactions={r.reactions}
                  userReactions={r.user_reactions}
                  onReact={(reaction) => handleReactReply(r.id, reaction)}
                  disabled={!user}
                />
              </div>
            );
          })}
        </div>

        {user ? (
          post.is_locked ? (
            <div className="forum-locked-notice">
              🔒 This thread is locked. No new replies can be posted.
            </div>
          ) : (
            <div className="forum-reply-form-card">
              <h2>Post a Reply</h2>
              {error && <div className="forum-error">{error}</div>}
              <form onSubmit={handleReply}>
                <textarea
                  placeholder="Share your thoughts..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={4}
                  className="forum-reply-textarea"
                />
                {replyPreviews.length > 0 && (
                  <div className="forum-image-previews">
                    {replyPreviews.map((src, i) => (
                      <div key={i} className="forum-image-preview-wrap">
                        <img src={src} alt={`preview ${i}`} className="forum-image-preview" />
                        <button type="button" className="forum-image-remove" onClick={() => removeReplyImage(i)}>
                          <MdClose size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="forum-reply-form-actions">
                  {replyImages.length < 3 && (
                    <label className="forum-image-upload-btn small">
                      <MdAttachFile size={16} /> Photo
                      <input type="file" accept="image/*" multiple onChange={handleReplyImageChange} style={{ display: 'none' }} />
                    </label>
                  )}
                  <button type="submit" className="forum-submit-btn" disabled={submitting}>
                    <MdSend size={18} />
                    {submitting ? 'Posting...' : 'Post Reply'}
                  </button>
                </div>
              </form>
            </div>
          )
        ) : (
          <div className="forum-login-prompt">
            <p>Want to join the discussion?</p>
            <Link to="/login" className="forum-submit-btn">Sign in to Reply</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForumPost;