import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { getAdminAnalytics, getAdminStats } from '../../services/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Tooltip as MapTooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAdminAnalytics(), getAdminStats()])
      .then(([analyticsRes, statsRes]) => {
        setAnalytics(analyticsRes.data);
        setStats(statsRes.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const totalTypes = analytics?.types?.reduce((sum, t) => sum + t.count, 0) || 1;
  const typeColors = ['#2d7a4f', '#2563eb', '#7c3aed', '#f97316', '#dc2626'];

  const monthlyChartData = analytics?.monthly?.map(m => ({
    month: m.month?.slice(5),
    count: m.count,
  })) || [];

  const resolutionRate = stats?.stats?.total_reports > 0
    ? Math.round((stats.stats.resolved / stats.stats.total_reports) * 100)
    : 0;

  const handleExport = () => {
    const rows = [];

    // Summary stats
    rows.push(['GreenGaps Analytics Export']);
    rows.push(['Generated', new Date().toLocaleString()]);
    rows.push([]);
    rows.push(['--- SUMMARY ---']);
    rows.push(['Total Reports', stats?.stats?.total_reports || 0]);
    rows.push(['Resolution Rate', `${resolutionRate}%`]);
    rows.push(['Total Users', stats?.users?.total_users || 0]);
    rows.push(['Pending Review', stats?.stats?.pending || 0]);
    rows.push([]);

    // Infrastructure types
    rows.push(['--- INFRASTRUCTURE TYPES ---']);
    rows.push(['Type', 'Count', 'Percentage']);
    analytics?.types?.forEach(t => {
      rows.push([t.infrastructure_type, t.count, `${Math.round((t.count / totalTypes) * 100)}%`]);
    });
    rows.push([]);

    // Monthly trends
    rows.push(['--- MONTHLY TRENDS ---']);
    rows.push(['Month', 'Reports']);
    analytics?.monthly?.forEach(m => {
      rows.push([m.month, m.count]);
    });
    rows.push([]);

    // Top locations
    rows.push(['--- TOP LOCATIONS ---']);
    rows.push(['Rank', 'Location', 'Reports']);
    analytics?.locations?.forEach((loc, i) => {
      rows.push([i + 1, loc.location, loc.count]);
    });

    // Convert to CSV
    const csv = rows.map(r => r.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `greengaps-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'white', border: '1px solid #e2e8f0',
          borderRadius: '8px', padding: '10px 14px', fontSize: '13px'
        }}>
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
        Loading analytics...
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="admin-page admin-analytics-page">

        {/* Header */}
        <div className="admin-page-header">
          <h1>Analytics & Insights</h1>
          <div className="admin-analytics-header-actions">
            <button className="admin-analytics-filter-btn">Last 30 Days</button>
            <button className="admin-analytics-export-btn" onClick={handleExport}>Export</button>
          </div>
        </div>

        {/* Top stats */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-info">
              <span className="admin-stat-label">Total Reports</span>
              <span className="admin-stat-number">{stats?.stats?.total_reports || 0}</span>
              <span className="admin-stat-sub green">↑ All time</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-info">
              <span className="admin-stat-label">Resolution Rate</span>
              <span className="admin-stat-number">{resolutionRate}%</span>
              <span className="admin-stat-sub green">↑ {resolutionRate}% completion</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-info">
              <span className="admin-stat-label">Total Users</span>
              <span className="admin-stat-number">{stats?.users?.total_users || 0}</span>
              <span className="admin-stat-sub green">↑ Registered</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-info">
              <span className="admin-stat-label">Pending Review</span>
              <span className="admin-stat-number">{stats?.stats?.pending || 0}</span>
              <span className="admin-stat-sub orange">Needs attention</span>
            </div>
          </div>
        </div>

        {/* Middle row — Types + Monthly */}
        <div className="admin-analytics-mid-grid">

          {/* Infrastructure Types */}
          <div className="admin-card">
            <h2>Infrastructure Types</h2>
            <div className="admin-analytics-type-list">
              {analytics?.types?.length === 0 && (
                <p className="admin-empty">No data yet.</p>
              )}
              {analytics?.types?.map((t, i) => (
                <div key={t.infrastructure_type} className="admin-analytics-type-item">
                  <div className="admin-analytics-type-label">
                    <span>{t.infrastructure_type}</span>
                    <span className="admin-analytics-type-pct">
                      {Math.round((t.count / totalTypes) * 100)}%
                    </span>
                  </div>
                  <div className="admin-analytics-progress-track">
                    <div
                      className="admin-analytics-progress-fill"
                      style={{
                        width: `${(t.count / totalTypes) * 100}%`,
                        background: typeColors[i % typeColors.length]
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Trends */}
          <div className="admin-card">
            <h2>Monthly Trends</h2>
            {monthlyChartData.length === 0 ? (
              <p className="admin-empty">No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyChartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2d7a4f" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2d7a4f" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#2d7a4f"
                    strokeWidth={2.5}
                    fill="url(#greenGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bottom row — Map + Top Locations */}
        <div className="admin-analytics-mid-grid">

          {/* Geographic Distribution */}
          <div className="admin-card">
            <h2>Geographic Distribution</h2>
            <div className="admin-analytics-map-wrap">
              <MapContainer
                center={[52.4862, -1.8904]}
                zoom={12}
                style={{ height: '280px', width: '100%', borderRadius: '10px' }}
                zoomControl={true}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                {analytics?.locations?.map((loc, i) => (
                  loc.latitude && loc.longitude ? (
                    <CircleMarker
                      key={i}
                      center={[loc.latitude, loc.longitude]}
                      radius={Math.min(Math.max(8, loc.count * 4), 30)}
                      fillColor="#2d7a4f"
                      color="#1e5c3a"
                      weight={1.5}
                      opacity={0.9}
                      fillOpacity={0.5}
                    >
                      <MapTooltip>
                        <strong>{loc.location}</strong><br />
                        {loc.count} {loc.count === 1 ? 'report' : 'reports'}
                      </MapTooltip>
                    </CircleMarker>
                  ) : null
                ))}
              </MapContainer>
            </div>
          </div>

          {/* Top Locations */}
          <div className="admin-card">
            <h2>Top Locations</h2>
            <div className="admin-analytics-locations">
              {analytics?.locations?.length === 0 && (
                <p className="admin-empty">No data yet.</p>
              )}
              {analytics?.locations?.map((loc, i) => (
                <div key={loc.location} className="admin-analytics-location-item">
                  <div className={`admin-analytics-rank rank-${Math.min(i + 1, 5)}`}>{i + 1}</div>
                  <div className="admin-analytics-location-info">
                    <strong>{loc.location}</strong>
                    <span>Birmingham</span>
                  </div>
                  <span className="admin-analytics-location-count">{loc.count} reports</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;