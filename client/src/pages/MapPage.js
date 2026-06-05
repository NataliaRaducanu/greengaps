import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import Navbar from '../components/layout/Navbar';
import { getAllReports, createReport } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MdAddAPhoto, MdClose, MdCheckCircle } from 'react-icons/md';
import './MapPage.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const priorityColors = {
  High: '#e53e3e',
  Medium: '#dd6b20',
  Low: '#d69e2e',
};

const statusColors = {
  'Open': '#ca8a04',
  'in_progress': '#2563eb',
  'resolved': '#2d7a4f',
};

const formatStatus = (status) => {
  if (status === 'in_progress') return 'In Progress';
  if (status === 'resolved') return 'Resolved';
  return status || 'Open';
};

const createColoredIcon = (color, isResolved = false) => L.divIcon({
  className: '',
  html: isResolved
    ? `<div style="width:24px;height:24px;border-radius:50%;background:#9ca3af;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
        <span style="color:white;font-size:12px;line-height:1;">✓</span>
       </div>`
    : `<div style="width:24px;height:24px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const LocationPicker = ({ onLocationSelect, active }) => {
  useMapEvents({
    click(e) {
      if (active) onLocationSelect(e.latlng);
    },
  });
  return null;
};

// My Location button
const LocateButton = () => {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const handleLocate = (e) => {
    e.stopPropagation();
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], 15, { animate: true, duration: 1.5 });
        L.marker([latitude, longitude], {
          icon: L.divIcon({
            className: '',
            html: `<div style="width:16px;height:16px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 2px 8px rgba(37,99,235,0.6)"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          })
        }).addTo(map).bindPopup('📍 You are here').openPopup();
        setLocating(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
    );
  };

  return (
    <button
      className="map-locate-btn"
      onClick={handleLocate}
      title="Go to my location"
      disabled={locating}
    >
      {locating ? '⏳' : '📍'}
    </button>
  );
};

// Satellite / Street tile switcher
const TileLayerSwitcher = ({ satellite }) => {
  if (satellite) {
    return (
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution='Tiles &copy; Esri'
      />
    );
  }
  return (
    <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    />
  );
};

// Heatmap layer component
const HeatmapLayer = ({ reports, priorityFilter }) => {
  const map = useMap();
  const heatRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    if (heatRef.current) {
      map.removeLayer(heatRef.current);
      heatRef.current = null;
    }

    if (reports.length === 0) return;

    const points = reports
      .filter(r => r.latitude && r.longitude)
      .map(r => {
        const weight = r.priority === 'High' ? 1.0
          : r.priority === 'Medium' ? 0.6
          : 0.3;
        return [r.latitude, r.longitude, weight];
      });

    heatRef.current = L.heatLayer(points, {
      radius: 35,
      blur: 25,
      maxZoom: 17,
      max: 1.0,
      gradient: {
        0.2: '#2563eb',
        0.4: '#7c3aed',
        0.6: '#f97316',
        0.8: '#dc2626',
        1.0: '#7f1d1d',
      }
    }).addTo(map);

    return () => {
      if (heatRef.current) {
        map.removeLayer(heatRef.current);
        heatRef.current = null;
      }
    };
  }, [map, reports, priorityFilter]);

  return null;
};

const MapPage = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [pickingLocation, setPickingLocation] = useState(false);
  const [clusteringEnabled, setClusteringEnabled] = useState(true);
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);
  const [satelliteView, setSatelliteView] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    infrastructure_type: '',
    location: '',
    priority: 'Low',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    try {
      const res = await getAllReports();
      setReports(res.data);
    } catch (err) {
      console.error('Error fetching reports:', err);
    }
  };

  const filteredReports = reports.filter((report) => {
    const priorityMatch = priorityFilter === 'all' || report.priority === priorityFilter;
    let statusMatch = true;
    if (statusFilter === 'active') {
      statusMatch = report.status !== 'resolved' && report.status !== 'Resolved';
    } else if (statusFilter === 'Open') {
      statusMatch = report.status === 'Open';
    } else if (statusFilter === 'in_progress') {
      statusMatch = report.status === 'in_progress' || report.status === 'In Progress';
    } else if (statusFilter === 'resolved') {
      statusMatch = report.status === 'resolved' || report.status === 'Resolved';
    }
    return priorityMatch && statusMatch;
  });

  const handleLocationSelect = async (latlng) => {
    setSelectedLocation(latlng);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`
      );
      const data = await response.json();
      const address = data.address
        ? data.address.road
          ? `${data.address.road}${data.address.suburb ? ', ' + data.address.suburb : ''}${data.address.city ? ', ' + data.address.city : ''}`
          : data.display_name.split(',').slice(0, 2).join(',')
        : `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`;
      setFormData(prev => ({ ...prev, location: address }));
    } catch (err) {
      setFormData(prev => ({
        ...prev,
        location: `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`
      }));
    }
    setPickingLocation(false);
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + photos.length > 3) {
      setError('Maximum 3 photos allowed');
      return;
    }
    setPhotos(prev => [...prev, ...files]);
    setPhotoPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLocation) {
      setError('Please select a location on the map');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const data = new FormData();
      data.append('infrastructure_type', formData.infrastructure_type);
      data.append('location', formData.location);
      data.append('latitude', selectedLocation.lat);
      data.append('longitude', selectedLocation.lng);
      data.append('priority', formData.priority);
      data.append('description', formData.description);
      photos.forEach(photo => data.append('photos', photo));

      await createReport(data);
      setSuccessData({
        type: formData.infrastructure_type,
        location: formData.location,
        priority: formData.priority,
      });
      setShowForm(false);
      setShowSuccess(true);
      setSelectedLocation(null);
      setPhotos([]);
      setPhotoPreviews([]);
      setFormData({ infrastructure_type: '', location: '', priority: 'Low', description: '' });
      fetchReports();
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const recentReports = reports.slice(0, 5);

  const markers = filteredReports.map((report) => {
    const isResolved = report.status === 'resolved' || report.status === 'Resolved';
    const markerColor = isResolved ? '#9ca3af' : (priorityColors[report.priority] || '#2d7a4f');
    return (
      <Marker
        key={report.id}
        position={[report.latitude, report.longitude]}
        icon={createColoredIcon(markerColor, isResolved)}
      >
        <Popup>
          <div className="popup-content">
            <div className="popup-header">
              <strong>{report.infrastructure_type}</strong>
              {!isResolved && (
                <span className={`popup-priority priority-${report.priority?.toLowerCase()}`}>
                  {report.priority}
                </span>
              )}
            </div>
            <p className="popup-location">📍 {report.location}</p>
            <p className="popup-description">{report.description}</p>
            <div className="popup-status-row">
              <span
                className="popup-status"
                style={{
                  background: (statusColors[report.status] || '#888') + '22',
                  color: statusColors[report.status] || '#888'
                }}
              >
                {formatStatus(report.status)}
              </span>
              {report.upvote_count > 0 && (
                <span className="popup-upvotes">
                  👍 {report.upvote_count} {report.upvote_count === 1 ? 'upvote' : 'upvotes'}
                </span>
              )}
            </div>
            <p className="popup-date">
              Submitted: {new Date(report.created_at).toLocaleDateString()}
            </p>
          </div>
        </Popup>
      </Marker>
    );
  });

  return (
    <div className="map-page">
      <Navbar />

      <div className="map-layout">
        <div className="map-sidebar">
          <h2>Report Infrastructure Gap</h2>

          {user ? (
            <button
              className="btn-new-report"
              onClick={() => { setShowForm(true); setPickingLocation(true); }}
            >
              + New Report
            </button>
          ) : (
            <p className="login-prompt">
              Please <a href="/login">sign in</a> to submit reports
            </p>
          )}

          <div className="sidebar-section">
            <h4>Visualization Options</h4>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={clusteringEnabled}
                onChange={(e) => setClusteringEnabled(e.target.checked)}
              />
              <span>Enable Marker Clustering</span>
            </label>
            <label className="checkbox-label" style={{ marginTop: 8 }}>
              <input
                type="checkbox"
                checked={heatmapEnabled}
                onChange={(e) => setHeatmapEnabled(e.target.checked)}
              />
              <span>Show Heatmap</span>
            </label>
            <label className="checkbox-label" style={{ marginTop: 8 }}>
              <input
                type="checkbox"
                checked={satelliteView}
                onChange={(e) => setSatelliteView(e.target.checked)}
              />
              <span>Satellite View</span>
            </label>
            {heatmapEnabled && (
              <div className="heatmap-legend">
                <div className="heatmap-bar" />
                <div className="heatmap-labels">
                  <span>Low density</span>
                  <span>High density</span>
                </div>
              </div>
            )}
          </div>

          <div className="sidebar-section">
            <h4>Filters</h4>
            <select className="filter-select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="all">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
            <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="active">Active Only (hide resolved)</option>
              <option value="Open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved Only</option>
            </select>
          </div>

          {pickingLocation && (
            <div className="info-box">
              <strong>📍 Click on the map to select location</strong>
            </div>
          )}
          {!pickingLocation && (
            <div className="info-box">
              <strong>ℹ️ Getting Started</strong>
              <p>Click "New Report" to add infrastructure gaps. Click on map markers to view details.</p>
            </div>
          )}

          <div className="sidebar-section">
            <h4>Statistics</h4>
            <div className="stats-grid">
              <div className="stat-box">
                <span className="stat-num green">{filteredReports.length}</span>
                <span className="stat-lbl">Visible Reports</span>
              </div>
              <div className="stat-box">
                <span className="stat-num red">
                  {filteredReports.filter(r => r.priority === 'High').length}
                </span>
                <span className="stat-lbl">High Priority</span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h4>Priority Legend</h4>
            <div className="legend">
              <div className="legend-item"><span className="dot red"></span> High Priority</div>
              <div className="legend-item"><span className="dot orange"></span> Medium Priority</div>
              <div className="legend-item"><span className="dot yellow"></span> Low Priority</div>
              <div className="legend-item">
                <span className="dot" style={{ background: '#9ca3af' }}></span> Resolved
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h4>Recent Reports</h4>
            <div className="recent-reports">
              {recentReports.map(report => (
                <div key={report.id} className="recent-report-item">
                  <span
                    className="dot"
                    style={{
                      background: (report.status === 'resolved' || report.status === 'Resolved')
                        ? '#9ca3af'
                        : priorityColors[report.priority]
                    }}
                  ></span>
                  <div>
                    <strong>{report.infrastructure_type}</strong>
                    <p>{report.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="map-container">
          <MapContainer
            center={[52.4862, -1.8904]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayerSwitcher satellite={satelliteView} />
            <LocateButton />
            <LocationPicker onLocationSelect={handleLocationSelect} active={pickingLocation} />

            {heatmapEnabled && (
              <HeatmapLayer reports={filteredReports} priorityFilter={priorityFilter} />
            )}

            {!heatmapEnabled && (
              clusteringEnabled
                ? <MarkerClusterGroup>{markers}</MarkerClusterGroup>
                : markers
            )}

            {selectedLocation && <Marker position={selectedLocation} />}
          </MapContainer>
        </div>
      </div>

      {/* SUCCESS ANIMATION */}
      {showSuccess && successData && (
        <div className="success-overlay" onClick={() => setShowSuccess(false)}>
          <div className="success-card" onClick={e => e.stopPropagation()}>
            <div className="success-icon-wrap">
              <div className="success-icon-ring" />
              <MdCheckCircle size={56} color="#2d7a4f" className="success-icon" />
            </div>
            <h2 className="success-title">Report Submitted!</h2>
            <p className="success-subtitle">Thank you for helping improve cycling infrastructure in Birmingham.</p>
            <div className="success-details">
              <div className="success-detail-row">
                <span className="success-detail-label">Type</span>
                <span className="success-detail-value">{successData.type}</span>
              </div>
              <div className="success-detail-row">
                <span className="success-detail-label">Location</span>
                <span className="success-detail-value">{successData.location}</span>
              </div>
              <div className="success-detail-row">
                <span className="success-detail-label">Priority</span>
                <span
                  className="success-detail-value"
                  style={{ color: priorityColors[successData.priority], fontWeight: 700 }}
                >
                  {successData.priority}
                </span>
              </div>
            </div>
            <p className="success-note">🔔 You'll receive email updates when the status changes.</p>
            <button className="success-close-btn" onClick={() => setShowSuccess(false)}>Close</button>
          </div>
        </div>
      )}

      {/* REPORT FORM MODAL */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Report Infrastructure Gap</h3>
            </div>
            <div className="modal-body">
              {pickingLocation && (
                <div className="location-prompt">
                  Click on the map to select the location of the infrastructure gap
                </div>
              )}
              {error && <div className="form-error">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Infrastructure Type *</label>
                  <select
                    value={formData.infrastructure_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, infrastructure_type: e.target.value }))}
                    required
                  >
                    <option value="">Select type...</option>
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
                    placeholder="Click on map to select location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Priority Level *</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium - Needs attention</option>
                    <option value="High">High - Urgent safety concern</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    placeholder="Describe the infrastructure gap..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    required
                    rows={4}
                  />
                </div>
                <div className="form-group">
                  <label>Photos (optional, max 3)</label>
                  <div className="photo-upload-area">
                    {photoPreviews.map((preview, index) => (
                      <div key={index} className="photo-preview">
                        <img src={preview} alt={`Preview ${index + 1}`} />
                        <button type="button" className="photo-remove-btn" onClick={() => removePhoto(index)}>
                          <MdClose size={14} />
                        </button>
                      </div>
                    ))}
                    {photos.length < 3 && (
                      <button type="button" className="photo-add-btn" onClick={() => fileInputRef.current.click()}>
                        <MdAddAPhoto size={24} color="#2d7a4f" />
                        <span>Add Photo</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoChange}
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                  />
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => {
                      setShowForm(false);
                      setPickingLocation(false);
                      setSelectedLocation(null);
                      setPhotos([]);
                      setPhotoPreviews([]);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Report'}
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

export default MapPage;