import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import Navbar from '../components/layout/Navbar';
import { getMyReports } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MdLocationOn, MdThumbUp, MdSearch, MdClose } from 'react-icons/md';
import './MyReports.css';

const API = 'http://localhost:5000/api';

const formatStatus = (status) => {
  if (!status) return '';
  if (status === 'in_progress') return 'In Progress';
  if (status === 'resolved') return 'Resolved';
  if (status === 'Open') return 'Open';
  return status;
};

const MyReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upvoting, setUpvoting] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchReports();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchReports = async () => {
    try {
      const res = await getMyReports();
      setReports(res.data);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (e, reportId) => {
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    setUpvoting(reportId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/reports/${reportId}/upvote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setReports(prev => prev.map(r =>
        r.id === reportId
          ? { ...r, upvote_count: data.upvote_count, user_upvoted: data.upvoted ? 1 : 0 }
          : r
      ));
    } catch (err) {
      console.error('Upvote error:', err);
    } finally {
      setUpvoting(null);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('GreenGaps - My Reports', 14, 20);
    doc.setFontSize(11);
    doc.text(`Total Reports: ${reports.length}`, 14, 30);
    doc.text(`Open: ${openCount}`, 14, 36);
    doc.text(`In Progress: ${progressCount}`, 14, 42);
    doc.text(`Resolved: ${resolvedCount}`, 14, 48);
    let y = 60;
    reports.forEach((report, index) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text(`${index + 1}. ${report.infrastructure_type}`, 14, y); y += 7;
      doc.setFontSize(10);
      doc.text(`Location: ${report.location}`, 14, y); y += 6;
      doc.text(`Priority: ${report.priority}`, 14, y); y += 6;
      doc.text(`Status: ${formatStatus(report.status)}`, 14, y); y += 6;
      doc.text(`Upvotes: ${report.upvote_count || 0}`, 14, y); y += 6;
      doc.text(`Submitted: ${new Date(report.created_at).toLocaleDateString()}`, 14, y); y += 10;
    });
    doc.save('my-reports.pdf');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'status-open';
      case 'in_progress':
      case 'In Progress': return 'status-progress';
      case 'resolved':
      case 'Resolved': return 'status-resolved';
      default: return 'status-open';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'priority-high';
      case 'Medium': return 'priority-medium';
      case 'Low': return 'priority-low';
      default: return 'priority-low';
    }
  };

  const openCount = reports.filter(r => r.status === 'Open').length;
  const progressCount = reports.filter(r => r.status === 'in_progress' || r.status === 'In Progress').length;
  const resolvedCount = reports.filter(r => r.status === 'resolved' || r.status === 'Resolved').length;

  // Filter + search + sort
  const filteredReports = reports
    .filter(r => {
      const matchSearch = search === '' ||
        r.infrastructure_type.toLowerCase().includes(search.toLowerCase()) ||
        r.location.toLowerCase().includes(search.toLowerCase()) ||
        (r.description || '').toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'all' ||
        (statusFilter === 'Open' && r.status === 'Open') ||
        (statusFilter === 'in_progress' && (r.status === 'in_progress' || r.status === 'In Progress')) ||
        (statusFilter === 'resolved' && (r.status === 'resolved' || r.status === 'Resolved'));

      const matchPriority = priorityFilter === 'all' || r.priority === priorityFilter;

      return matchSearch && matchStatus && matchPriority;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === 'priority') {
        const order = { High: 0, Medium: 1, Low: 2 };
        return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
      }
      if (sortBy === 'upvotes') return (b.upvote_count || 0) - (a.upvote_count || 0);
      return 0;
    });

  const hasFilters = search !== '' || statusFilter !== 'all' || priorityFilter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setSortBy('newest');
  };

  return (
    <div className="my-reports-page">
      <Navbar />
      <div className="my-reports-content">
        <div className="my-reports-header">
          <div>
            <h1>My Reports</h1>
            <p>Track the status of your submitted infrastructure reports</p>
          </div>
          <div className="reports-header-actions">
            <button className="btn-export" onClick={exportPDF} disabled={reports.length === 0}>
              Export as PDF
            </button>
            <button className="btn-new-report" onClick={() => navigate('/map')}>
              + New Report
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="reports-stats">
          <div className="reports-stat-card">
            <span className="reports-stat-label">Total Reports</span>
            <span className="reports-stat-number">{reports.length}</span>
          </div>
          <div className="reports-stat-card open">
            <span className="reports-stat-label">Open</span>
            <span className="reports-stat-number open">{openCount}</span>
          </div>
          <div className="reports-stat-card progress">
            <span className="reports-stat-label">In Progress</span>
            <span className="reports-stat-number progress">{progressCount}</span>
          </div>
          <div className="reports-stat-card resolved">
            <span className="reports-stat-label">Resolved</span>
            <span className="reports-stat-number resolved">{resolvedCount}</span>
          </div>
        </div>

        {/* Reports List */}
        <div className="reports-list-section">
          <div className="reports-list-header">
            <h2>All Reports</h2>
            {hasFilters && (
              <button className="reports-clear-filters" onClick={clearFilters}>
                <MdClose size={14} /> Clear filters
              </button>
            )}
          </div>

          {/* Search & Filter Bar */}
          <div className="reports-filter-bar">
            <div className="reports-search-wrap">
              <MdSearch size={18} color="#aaa" />
              <input
                type="text"
                placeholder="Search by type, location or description..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="reports-search-input"
              />
              {search && (
                <button className="reports-search-clear" onClick={() => setSearch('')}>
                  <MdClose size={16} />
                </button>
              )}
            </div>
            <select
              className="reports-filter-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="Open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <select
              className="reports-filter-select"
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <select
              className="reports-filter-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority">By Priority</option>
              <option value="upvotes">Most Upvoted</option>
            </select>
          </div>

          {loading ? (
            <div className="loading">Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🚲</div>
              <h3>No reports yet</h3>
              <p>You haven't submitted any infrastructure reports yet. Help make Birmingham safer for cyclists by reporting issues you spot.</p>
              <button className="empty-state-btn" onClick={() => navigate('/map')}>
                + Submit Your First Report
              </button>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3>No reports match your search</h3>
              <p>Try different keywords or clear your filters.</p>
              <button className="empty-state-btn" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <p className="reports-results-count">
                Showing {filteredReports.length} of {reports.length} reports
              </p>
              <div className="reports-list">
                {filteredReports.map(report => (
                  <div
                    key={report.id}
                    className="report-card"
                    onClick={() => navigate(`/my-reports/${report.id}`)}
                  >
                    <div className="report-card-header">
                      <div className="report-card-title">
                        <h3>{report.infrastructure_type}</h3>
                        <span className={`priority-badge ${getPriorityColor(report.priority)}`}>
                          {report.priority}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button
                          className={`upvote-btn ${report.user_upvoted ? 'upvoted' : ''}`}
                          onClick={(e) => handleUpvote(e, report.id)}
                          disabled={upvoting === report.id}
                          title={report.user_upvoted ? 'Remove upvote' : 'Upvote this report'}
                        >
                          <MdThumbUp size={14} />
                          <span>{report.upvote_count || 0}</span>
                        </button>
                        <span className={`status-badge ${getStatusColor(report.status)}`}>
                          {formatStatus(report.status)}
                        </span>
                      </div>
                    </div>

                    <div className="report-card-location">
                      <MdLocationOn size={14} />
                      <span>{report.location}</span>
                    </div>

                    <p className="report-card-date">
                      Submitted: {new Date(report.created_at).toLocaleDateString()}
                    </p>

                    {report.last_comment && (
                      <div className="report-card-comment">
                        <p>{report.last_comment}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyReports;