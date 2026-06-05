import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { getAdminReports } from '../../services/api';
import * as XLSX from 'xlsx';

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [priorityFilter, setPriorityFilter] = useState('All Priority');

  useEffect(() => {
    getAdminReports()
      .then(res => setReports(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = reports.filter(r => {
    const matchSearch =
      r.location.toLowerCase().includes(search.toLowerCase()) ||
      r.infrastructure_type.toLowerCase().includes(search.toLowerCase()) ||
      String(r.id).includes(search);
    const matchStatus = statusFilter === 'All Status' || r.status === statusFilter;
    const matchPriority = priorityFilter === 'All Priority' || r.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const formatStatus = (status) => {
    if (status === 'in_progress') return 'In Progress';
    if (status === 'resolved') return 'Resolved';
    return status || 'Open';
  };

  const handleExport = () => {
    const data = filtered.map(r => ({
      'ID': r.id,
      'Type': r.infrastructure_type,
      'Location': r.location,
      'Priority': r.priority,
      'Status': formatStatus(r.status),
      'Date Submitted': r.created_at
        ? new Date(r.created_at).toLocaleDateString('en-GB', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
          })
        : '',
      'Submitted By': r.full_name || 'Unknown',
      'Email': r.email || '',
      'Description': r.description || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 6 },   // ID
      { wch: 18 },  // Type
      { wch: 40 },  // Location
      { wch: 12 },  // Priority
      { wch: 14 },  // Status
      { wch: 20 },  // Date
      { wch: 20 },  // Submitted By
      { wch: 28 },  // Email
      { wch: 50 },  // Description
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'GreenGaps Reports');

    const date = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    XLSX.writeFile(workbook, `greengaps-reports-${date}.xlsx`);
  };

  const getStatusClass = (status) => {
    if (status === 'Open') return 'status-open';
    if (status === 'in_progress') return 'status-progress';
    if (status === 'resolved') return 'status-resolved';
    return 'status-open';
  };

  const getPriorityClass = (priority) => {
    if (priority === 'High') return 'badge-high';
    if (priority === 'Medium') return 'badge-medium';
    return 'badge-low';
  };

  if (loading) return (
    <AdminLayout>
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        Loading reports...
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="admin-page admin-reports-page">
        <div className="admin-page-header">
          <h1>All Reports</h1>
          <button className="admin-export-btn" onClick={handleExport}>
            Export to Excel
          </button>
        </div>

        {/* Filters */}
        <div className="admin-reports-filters">
          <input
            type="text"
            placeholder="Search by location, type, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-reports-search"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-reports-select"
          >
            <option>All Status</option>
            <option value="Open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="admin-reports-select"
          >
            <option>All Priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Table */}
        <div className="admin-reports-table-card">
          <table className="admin-reports-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Location</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="admin-reports-empty">
                    No reports found.
                  </td>
                </tr>
              )}
              {filtered.map(report => (
                <tr key={report.id}>
                  <td className="admin-reports-id">#{report.id}</td>
                  <td className="admin-reports-type">{report.infrastructure_type}</td>
                  <td className="admin-reports-location">{report.location}</td>
                  <td>
                    <span className={`admin-reports-badge ${getPriorityClass(report.priority)}`}>
                      {report.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-reports-status ${getStatusClass(report.status)}`}>
                      {formatStatus(report.status)}
                    </span>
                  </td>
                  <td className="admin-reports-date">{report.created_at?.split('T')[0]}</td>
                  <td>
                    <Link
                      to={`/admin/reports/${report.id}`}
                      className={`admin-reports-update-btn ${report.status === 'resolved' ? 'resolved' : ''}`}
                    >
                      Update
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-reports-footer">
          Showing {filtered.length} of {reports.length} reports
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReports;