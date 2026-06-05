import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { getAdminReport, updateReportStatus } from '../../services/api';
import { MdArrowBack, MdLocationOn } from 'react-icons/md';

const formatStatus = (status) => {
  if (!status) return '';
  if (status === 'in_progress') return 'In Progress';
  if (status === 'resolved') return 'Resolved';
  if (status === 'Open') return 'Open';
  return status;
};

const AdminUpdateReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [sendNotification, setSendNotification] = useState(true);
  const [formData, setFormData] = useState({ status: '', comment: '' });

  const fetchReport = useCallback(async () => {
    try {
      const res = await getAdminReport(id);
      setReport(res.data);
      setFormData(prev => ({ ...prev, status: res.data.status }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.comment) { setError('Please add a comment.'); return; }
    setSaving(true);
    setError('');
    try {
      await updateReportStatus(id, { ...formData, sendNotification });
      setSuccess('Status updated and user notified!');
      fetchReport();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update status.');
    } finally {
      setSaving(false);
    }
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      High: { background: '#fee2e2', color: '#dc2626' },
      Medium: { background: '#fff7ed', color: '#f97316' },
      Low: { background: '#fefce8', color: '#ca8a04' },
    };
    return styles[priority] || styles.Low;
  };

  if (loading) return (
    <AdminLayout>
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        Loading report...
      </div>
    </AdminLayout>
  );

  if (!report) return (
    <AdminLayout>
      <div className="admin-loading">Report not found.</div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="admin-page admin-update-page">

        <button className="admin-back-btn" onClick={() => navigate('/admin/reports')}>
          <MdArrowBack size={16} /> Back to Reports
        </button>

        <h1>Update Report Status</h1>

        {/* Report card */}
        <div className="admin-update-card">
          <div className="admin-update-report-header">
            <div>
              <h2>Report #{report.id}: {report.infrastructure_type} - {report.location}</h2>
              <p>Submitted by {report.full_name || 'Unknown'} on {report.created_at?.split('T')[0]}</p>
            </div>
            <span
              className="admin-update-priority-badge"
              style={getPriorityBadge(report.priority)}
            >
              {report.priority} Priority
            </span>
          </div>

          <div className="admin-update-description">
            <p>{report.description}</p>
            <div className="admin-update-location">
              <MdLocationOn size={14} color="#dc2626" />
              <span>{report.location} ({report.latitude?.toFixed(4)}, {report.longitude?.toFixed(4)})</span>
            </div>
          </div>

          {success && <div className="admin-success">{success}</div>}
          {error && <div className="admin-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="admin-update-form-group">
              <label>Update Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="admin-update-input"
              >
                <option value="Open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div className="admin-update-form-group">
              <label>Add Update Comment *</label>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Admin reviewed - scheduled for Q2 2026. Infrastructure planning team is conducting site assessment."
                rows={5}
                className="admin-update-input"
              />
              <small>This message will be visible to the user and sent via email notification</small>
            </div>

            <div className="admin-update-notify">
              <input
                type="checkbox"
                id="sendNotification"
                checked={sendNotification}
                onChange={(e) => setSendNotification(e.target.checked)}
                className="admin-update-checkbox"
              />
              <label htmlFor="sendNotification">Send email notification to user</label>
            </div>

            <div className="admin-update-actions">
              <button
                type="button"
                className="admin-update-cancel"
                onClick={() => navigate('/admin/reports')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="admin-update-submit"
                disabled={saving}
              >
                {saving ? 'Updating...' : 'Update Status & Notify User'}
              </button>
            </div>
          </form>
        </div>

        {/* Status History */}
        <div className="admin-update-card">
          <h2>Status History</h2>
          <div className="admin-update-history">
            {report.status_updates?.length === 0 && (
              <p className="admin-empty">No history yet.</p>
            )}
            {report.status_updates?.map(update => (
              <div key={update.id} className="admin-update-history-item">
                <div className="admin-update-history-header">
                  <span className="admin-update-history-badge">
                    {formatStatus(update.status)}
                  </span>
                  <span className="admin-update-history-date">
                    {new Date(update.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </span>
                </div>
                <p>{update.comment}</p>
                <small>{update.updated_by}</small>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminUpdateReport;