import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);

// Reports
export const getAllReports = () => api.get('/reports');
export const getMyReports = () => api.get('/reports/my');
export const getReport = (id) => api.get(`/reports/${id}`);
export const createReport = (data) => api.post('/reports', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateReport = (id, data) => api.put(`/reports/${id}`, data);

// Users
export const getProfile = () => api.get('/users/profile');
export const updateProfile = (data) => api.put('/users/profile', data);
export const uploadProfilePicture = (formData) => api.post('/users/profile/picture', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const deleteAccount = (data) => api.delete('/users/profile', { data });
export const getNotifications = () => api.get('/users/notifications');
export const markNotificationRead = (id) => api.put(`/users/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.put('/users/notifications/read-all');

// Forum
export const getForumPosts = () => api.get('/forum');
export const getForumPost = (id) => api.get(`/forum/${id}`);
export const createForumPost = (data) => api.post('/forum', data);
export const createForumReply = (id, data) => api.post(`/forum/${id}/replies`, data);
export const deleteForumPost = (id) => api.delete(`/forum/${id}`);
export const deleteForumReply = (id, replyId) => api.delete(`/forum/${id}/replies/${replyId}`);

// Search
export const searchAll = (q) => api.get(`/search?q=${encodeURIComponent(q)}`);

// Admin
export const getAdminStats = () => api.get('/admin/stats');
export const getAdminReports = () => api.get('/admin/reports');
export const getAdminReport = (id) => api.get(`/admin/reports/${id}`);
export const updateReportStatus = (id, data) => api.put(`/admin/reports/${id}/status`, data);
export const getAdminUsers = () => api.get('/admin/users');
export const updateUserRole = (id, data) => api.put(`/admin/users/${id}/role`, data);
export const deleteAdminUser = (id) => api.delete(`/admin/users/${id}`);
export const getAdminAnalytics = () => api.get('/admin/analytics');
export const deleteAdminForumPost = (id) => api.delete(`/admin/forum/${id}`);

export default api;
