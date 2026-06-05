import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/api';
import './Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: 1 } : n)
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const getNotificationIcon = (title) => {
    if (title.includes('Status')) return '🕐';
    if (title.includes('Resolved')) return '✅';
    if (title.includes('Comment')) return 'ℹ️';
    if (title.includes('Submitted')) return '✅';
    return '🔔';
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'Unread') return !n.is_read;
    if (filter === 'Read') return n.is_read;
    return true;
  });

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="notifications-page">
      <Navbar />
      <div className="notifications-content">
        <div className="notifications-header">
          <div>
            <h1>Notifications</h1>
            <p>Stay updated on your report status</p>
          </div>
          <button className="mark-all-btn" onClick={handleMarkAllRead}>
            Mark all as read
          </button>
        </div>

        {/* Filter tabs */}
        <div className="notifications-tabs">
          {['All', 'Unread', 'Read'].map(tab => (
            <button
              key={tab}
              className={`tab-btn ${filter === tab ? 'active' : ''}`}
              onClick={() => setFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Notifications list */}
        <div className="notifications-list">
          {loading ? (
            <div className="loading">Loading notifications...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="empty-state">
                <div className="empty-state-icon">
                    {filter === 'Unread' ? '✅' : '🔔'}
                </div>
                <h3>
                    {filter === 'Unread' ? 'All caught up!' :
                    filter === 'Read' ? 'No read notifications' :
                    'No notifications yet'}
                </h3>
                <p>
                    {filter === 'Unread'
                        ? 'You have no unread notifications. Great job staying on top of things!'
                        : filter === 'Read'
                        ? "You haven't read any notifications yet."
                        : "When your reports get status updates, they'll appear here."}
                </p>
            </div>
            
          ) : (
            filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                onClick={() => !notification.is_read && handleMarkRead(notification.id)}
              >
                <div className="notification-icon">
                  {getNotificationIcon(notification.title)}
                </div>
                <div className="notification-body">
                  <strong>{notification.title}</strong>
                  <p>{notification.message}</p>
                  <small>{getTimeAgo(notification.created_at)}</small>
                </div>
                {!notification.is_read && (
                  <div className="unread-dot"></div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;