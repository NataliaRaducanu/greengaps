import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { getReport, updateReport } from '../services/api';
import {
  MdLocationOn, MdEdit, MdMap, MdNotifications,
  MdShare, MdContentCopy, MdCheck, MdPrint
} from 'react-icons/md';
import './ReportDetail.css';

const formatStatus = (status) => {
  if (!status) return '';
  if (status === 'in_progress') return 'In Progress';
  if (status === 'resolved') return 'Resolved';
  if (status === 'Open') return 'Open';
  return status;
};

const ReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchReport = async () => {
    try {
      const res = await getReport(id);
      setReport(res.data);
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateReport(id, editData);
      setShowEdit(false);
      fetchReport();
    } catch (err) {
      console.error('Error updating report:', err);
    } finally {
      setSaving(false);
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
    const text = `Check out this cycling infrastructure report in Birmingham: ${report.infrastructure_type} at ${report.location}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    setShowShareMenu(false);
  };

  const handleShareTwitter = () => {
    const url = window.location.href;
    const text = `Cycling infrastructure issue reported in Birmingham: ${report.infrastructure_type} at ${report.location} #GreenGaps #Birmingham #Cycling`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    setShowShareMenu(false);
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'High': return 'priority-high';
      case 'Medium': return 'priority-medium';
      case 'Low': return 'priority-low';
      default: return 'priority-low';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Open': return 'status-open';
      case 'in_progress':
      case 'In Progress': return 'status-progress';
      case 'resolved':
      case 'Resolved': return 'status-resolved';
      default: return 'status-open';
    }
  };

  if (loading) return <div><Navbar /><div className="loading-page">Loading...</div></div>;
  if (!report) return <div><Navbar /><div className="loading-page">Report not found</div></div>;

  return (
    <div className="report-detail-page">
      <Navbar />
      <div className="report-detail-content">

        <Link to="/my-reports" className="back-link">← Back to My Reports</Link>

        <div className="report-detail-header">
          <div>
            <h1>{report.infrastructure_type} - {report.location}</h1>
            <p>Report #{report.id} • Submitted {new Date(report.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className={`status-badge ${getStatusClass(report.status)}`}>
              {formatStatus(report.status)}
            </span>
          </div>
        </div>

        <div className="report-detail-body">
          <div className="report-detail-main">
            <div className="detail-card">
              <h3>Report Details</h3>
              <div className="detail-row">
                <span className="detail-label">Infrastructure Type</span>
                <span className="detail-value">{report.infrastructure_type}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Location</span>
                <div className="detail-value">
                  <div className="location-value">
                    <MdLocationOn size={16} color="#2d7a4f" />
                    <strong>{report.location}</strong>
                  </div>
                  <small>Lat: {report.latitude}, Lng: {report.longitude}</small>
                </div>
              </div>
              <div className="detail-row">
                <span className="detail-label">Priority Level</span>
                <span className={`priority-badge ${getPriorityClass(report.priority)}`}>
                  {report.priority} Priority
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Description</span>
                <span className="detail-value">{report.description}</span>
              </div>
            </div>

            {/* Photos */}
            {report.photos && report.photos.length > 0 && (
              <div className="detail-card">
                <h3>Photos ({report.photos.length})</h3>
                <div className="report-photos-grid">
                  {report.photos.map((photo, i) => (
                    <div
                      key={photo.id}
                      className="report-photo-thumb"
                      onClick={() => setLightboxPhoto(photo.filename)}
                    >
                      <img
                        src={`(process.env.REACT_APP_API_URL || 'http://localhost:5000')${photo.filename}`}
                        alt={`Report ${i + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Updates */}
            <div className="detail-card">
              <h3>Status Updates</h3>
              {report.status_updates && report.status_updates.length > 0 ? (
                <div className="status-timeline">
                  {report.status_updates.map((update) => (
                    <div key={update.id} className="timeline-item">
                      <div className="timeline-icon">🕐</div>
                      <div className="timeline-content">
                        <strong>{formatStatus(update.status)}</strong>
                        <p>{update.comment}</p>
                        <small>
                          {new Date(update.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'long', year: 'numeric'
                          })} • By: {update.updated_by}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-updates">No status updates yet.</p>
              )}
            </div>
          </div>

          <div className="report-detail-sidebar">
            <div className="detail-card">
              <h3>Actions</h3>
              <button className="action-btn primary" onClick={() => navigate('/map')}>
                <MdMap size={18} /> View on Map
              </button>
              <button
                className="action-btn secondary"
                onClick={() => {
                  setEditData({
                    infrastructure_type: report.infrastructure_type,
                    location: report.location,
                    priority: report.priority,
                    description: report.description,
                  });
                  setShowEdit(true);
                }}
              >
                <MdEdit size={18} /> Edit Report
              </button>

              {/* Share button */}
              <div className="share-btn-wrap">
                <button
                  className="action-btn share"
                  onClick={() => setShowShareMenu(prev => !prev)}
                >
                  <MdShare size={18} /> Share Report
                </button>
                {showShareMenu && (
                  <div className="share-menu">
                    <button className="share-menu-item" onClick={handleCopyLink}>
                      {copied
                        ? <MdCheck size={16} color="#2d7a4f" />
                        : <MdContentCopy size={16} />}
                      {copied ? 'Link Copied!' : 'Copy Link'}
                    </button>
                    <button className="share-menu-item whatsapp" onClick={handleShareWhatsApp}>
                      <span>💬</span> Share on WhatsApp
                    </button>
                    <button className="share-menu-item twitter" onClick={handleShareTwitter}>
                      <span>🐦</span> Share on X/Twitter
                    </button>
                  </div>
                )}
              </div>

              {/* Print button */}
              <button className="action-btn print" onClick={() => window.print()}>
                <MdPrint size={18} /> Print Report
              </button>
            </div>

            <div className="detail-card notification-card">
              <MdNotifications size={20} color="#2d7a4f" />
              <div>
                <strong>Email Notifications</strong>
                <p>You'll receive updates when the status changes</p>
              </div>
            </div>

            <div className="detail-card">
              <h3>Location</h3>
              <div className="location-map-preview">
                <div className="map-preview-placeholder">
                  <MdLocationOn size={24} color="#e53e3e" />
                  <span>{report.latitude?.toFixed(2)}, {report.longitude?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div className="photo-lightbox" onClick={() => setLightboxPhoto(null)}>
          <button className="lightbox-close" onClick={() => setLightboxPhoto(null)}>✕</button>
          <img
            src={`(process.env.REACT_APP_API_URL || 'http://localhost:5000')${lightboxPhoto}`}
            alt="Full size"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div className="edit-modal-overlay">
          <div className="edit-modal">
            <div className="edit-modal-header">
              <h3>Edit Report</h3>
            </div>
            <div className="edit-modal-body">
              <form onSubmit={handleEdit}>
                <div className="form-group">
                  <label>Infrastructure Type *</label>
                  <select
                    value={editData.infrastructure_type}
                    onChange={(e) => setEditData(prev => ({ ...prev, infrastructure_type: e.target.value }))}
                    required
                  >
                    <option value="Bike Lane">Bike Lane</option>
                    <option value="Bike Parking">Bike Parking</option>
                    <option value="Traffic Signal">Traffic Signal</option>
                    <option value="Crossing">Crossing</option>
                    <option value="Signage">Signage</option>
                    <option value="Road Surface">Road Surface</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Location *</label>
                  <input
                    type="text"
                    value={editData.location}
                    onChange={(e) => setEditData(prev => ({ ...prev, location: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Priority Level *</label>
                  <select
                    value={editData.priority}
                    onChange={(e) => setEditData(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    value={editData.description}
                    onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                    required
                    rows={4}
                  />
                </div>
                <div className="edit-modal-footer">
                  <button type="button" className="btn-cancel" onClick={() => setShowEdit(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportDetail;
