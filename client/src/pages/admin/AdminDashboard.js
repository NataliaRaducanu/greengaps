import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { getAdminStats, getAdminAnalytics } from '../../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import {
  MdBarChart, MdAccessTime, MdTrendingUp, MdCheckCircle,
  MdArticle, MdPerson, MdLocationOn, MdFiberManualRecord
} from 'react-icons/md';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAdminStats(), getAdminAnalytics()])
      .then(([statsRes, analyticsRes]) => {
        setData(statsRes.data);
        setAnalytics(analyticsRes.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const getPriorityBadgeClass = (priority) => {
    if (priority === 'High') return 'badge-high';
    if (priority === 'Medium') return 'badge-medium';
    return 'badge-low';
  };

  const getStatusClass = (status) => {
    if (status === 'Open') return 'status-open';
    if (status === 'in_progress') return 'status-progress';
    if (status === 'resolved') return 'status-resolved';
    return 'status-open';
  };

  const statusChartData = [
    { name: 'Open', count: data?.stats?.pending || 0, color: '#eab308' },
    { name: 'In Progress', count: data?.stats?.in_progress || 0, color: '#2563eb' },
    { name: 'Resolved', count: data?.stats?.resolved || 0, color: '#2d7a4f' },
  ];

  const typeChartData = analytics?.types?.map(t => ({
    name: t.infrastructure_type?.length > 10
      ? t.infrastructure_type.substring(0, 10) + '...'
      : t.infrastructure_type,
    count: t.count,
  })) || [];

  const resolutionRate = data?.stats?.total_reports > 0
    ? Math.round((data.stats.resolved / data.stats.total_reports) * 100)
    : 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', fontSize: '13px' }}>
          <p style={{ fontWeight: 700, marginBottom: 4 }}>{label}</p>
          <p style={{ color: '#2d7a4f' }}>{payload[0].value} reports</p>
        </div>
      );
    }
    return null;
  };

  if (loading) return (
    <AdminLayout>
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        Loading dashboard...
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="admin-page">

        {/* Header */}
        <div className="admin-dash-header">
          <div>
            <h1>Dashboard Overview</h1>
            <p className="admin-page-sub">Reports & Analytics — Executive dashboard with key performance metrics</p>
          </div>
          <div className="admin-dash-date">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Stats cards */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-info">
              <span className="admin-stat-label">Total Reports</span>
              <span className="admin-stat-number">{data?.stats?.total_reports || 0}</span>
              <span className="admin-stat-sub">All time</span>
            </div>
            <div className="admin-stat-icon blue">
              <MdBarChart size={22} color="#2563eb" />
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-info">
              <span className="admin-stat-label">Pending Review</span>
              <span className="admin-stat-number">{data?.stats?.pending || 0}</span>
              <span className="admin-stat-sub orange">Needs attention</span>
            </div>
            <div className="admin-stat-icon orange">
              <MdAccessTime size={22} color="#f97316" />
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-info">
              <span className="admin-stat-label">In Progress</span>
              <span className="admin-stat-number">{data?.stats?.in_progress || 0}</span>
              <span className="admin-stat-sub blue">Active work</span>
            </div>
            <div className="admin-stat-icon blue2">
              <MdTrendingUp size={22} color="#2563eb" />
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-info">
              <span className="admin-stat-label">Resolved</span>
              <span className="admin-stat-number">{data?.stats?.resolved || 0}</span>
              <span className="admin-stat-sub green">{resolutionRate}% completion rate</span>
            </div>
            <div className="admin-stat-icon green">
              <MdCheckCircle size={22} color="#2d7a4f" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="admin-charts-grid">
          <div className="admin-card">
            <div className="admin-card-header">
              <h2>Reports by Status</h2>
              <div className="admin-chart-legend">
                <span><MdFiberManualRecord size={10} color="#eab308" /> Open</span>
                <span><MdFiberManualRecord size={10} color="#2563eb" /> In Progress</span>
                <span><MdFiberManualRecord size={10} color="#2d7a4f" /> Resolved</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statusChartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  {statusChartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <h2>Reports by Type</h2>
            </div>
            {typeChartData.length === 0 ? (
              <div className="admin-empty">No data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={typeChartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#2d7a4f" radius={[6, 6, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bottom grid */}
        <div className="admin-dashboard-grid">

          {/* Recent Reports */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h2>Recent Reports</h2>
              <Link to="/admin/reports" className="admin-card-link">View all →</Link>
            </div>
            <div className="admin-recent-list">
              {data?.recent?.length === 0 && (
                <div className="admin-empty">No reports yet.</div>
              )}
              {data?.recent?.map(report => (
                <Link to={`/admin/reports/${report.id}`} key={report.id} className="admin-recent-item">
                  <div className="admin-recent-left">
                    <div className="admin-recent-id">#{report.id}</div>
                    <div className="admin-recent-info">
                      <strong>{report.infrastructure_type} — {report.location}</strong>
                      <div className="admin-recent-meta">
                        <span><MdPerson size={11} /> {report.full_name || 'Unknown'}</span>
                        <span><MdLocationOn size={11} /> {report.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="admin-recent-badges">
                    <span className={`admin-badge ${getPriorityBadgeClass(report.priority)}`}>
                      {report.priority}
                    </span>
                    <span className={`admin-status ${getStatusClass(report.status)}`}>
                      {report.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h2>Recent Activity</h2>
            </div>
            <div className="admin-activity-list">
              {data?.recent?.length === 0 && (
                <div className="admin-empty">No activity yet.</div>
              )}
              {data?.recent?.map(report => (
                <div key={report.id} className="admin-activity-item">
                  <div className="admin-activity-icon">
                    <MdArticle size={15} color="#2d7a4f" />
                  </div>
                  <div className="admin-activity-content">
                    <p>
                      <strong>{report.full_name || 'A user'}</strong> submitted a{' '}
                      <strong>{report.priority} priority</strong> report for{' '}
                      <strong>{report.infrastructure_type}</strong>
                    </p>
                    <div className="admin-activity-meta">
                      <span><MdLocationOn size={11} /> {report.location}</span>
                      <span>{report.created_at?.replace('T', ' ').split('.')[0]}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;