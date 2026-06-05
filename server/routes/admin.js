const express = require('express');
const router = express.Router();
const { db, pool, isProduction } = require('../config/database');
const { adminAuth } = require('../middleware/auth');
const { sendStatusUpdateEmail, sendBroadcastEmail } = require('../config/email');

// Helper functions
const dbGet = (query, params) => {
  if (isProduction) {
    let i = 0;
    const pgQuery = query.replace(/\?/g, () => `$${++i}`);
    return pool.query(pgQuery, params).then(r => r.rows[0]);
  }
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (query, params) => {
  if (isProduction) {
    let i = 0;
    const pgQuery = query.replace(/\?/g, () => `$${++i}`);
    return pool.query(pgQuery, params).then(r => r.rows);
  }
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbRun = (query, params) => {
  if (isProduction) {
    let i = 0;
    const pgQuery = query.replace(/\?/g, () => `$${++i}`);
    return pool.query(pgQuery, params);
  }
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const dbInsert = async (query, params) => {
  if (isProduction) {
    let i = 0;
    const pgQuery = query.replace(/\?/g, () => `$${++i}`) + ' RETURNING id';
    const r = await pool.query(pgQuery, params);
    return { lastID: r.rows[0].id };
  }
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID });
    });
  });
};

// Stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const stats = await dbGet(`
      SELECT
        COUNT(*) as total_reports,
        SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved
      FROM reports
    `, []);
    const users = await dbGet('SELECT COUNT(*) as total_users FROM users', []);
    const priority = await dbAll('SELECT priority, COUNT(*) as count FROM reports GROUP BY priority', []);
    const recent = await dbAll(`
      SELECT reports.*, users.full_name 
      FROM reports 
      JOIN users ON reports.user_id = users.id 
      ORDER BY reports.created_at DESC LIMIT 5
    `, []);
    res.json({ stats, users, priority, recent });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all reports
router.get('/reports', adminAuth, async (req, res) => {
  try {
    const rows = await dbAll(`
      SELECT reports.*, users.full_name, users.email
      FROM reports
      JOIN users ON reports.user_id = users.id
      ORDER BY reports.created_at DESC
    `, []);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single report
router.get('/reports/:id', adminAuth, async (req, res) => {
  try {
    const report = await dbGet(`
      SELECT reports.*, users.full_name, users.email
      FROM reports
      JOIN users ON reports.user_id = users.id
      WHERE reports.id = ?
    `, [req.params.id]);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    const updates = await dbAll(
      'SELECT * FROM status_updates WHERE report_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json({ ...report, status_updates: updates });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update report status
router.put('/reports/:id/status', adminAuth, async (req, res) => {
  const { status, comment, sendNotification } = req.body;
  try {
    await dbRun('UPDATE reports SET status = ? WHERE id = ?', [status, req.params.id]);
    await dbRun(
      'INSERT INTO status_updates (report_id, status, comment, updated_by) VALUES (?, ?, ?, ?)',
      [req.params.id, status, comment, 'Admin']
    );
    const report = await dbGet(`
      SELECT reports.user_id, reports.location, users.email, users.full_name
      FROM reports
      JOIN users ON reports.user_id = users.id
      WHERE reports.id = ?
    `, [req.params.id]);

    if (report) {
      await dbRun(
        'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
        [report.user_id, 'Report Status Updated',
          `Your report for ${report.location} has been updated to: ${status}. ${comment}`]
      );
      if (sendNotification !== false) {
        sendStatusUpdateEmail(report.email, report.full_name, report.location, status, comment)
          .then(() => console.log('Status update email sent to', report.email))
          .catch(err => console.error('Email error:', err));
      }
    }
    res.json({ message: 'Status updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const rows = await dbAll(`
      SELECT u.id, u.full_name, u.email, u.role, u.created_at,
        COUNT(r.id) as report_count
      FROM users u
      LEFT JOIN reports r ON r.user_id = u.id
      GROUP BY u.id, u.full_name, u.email, u.role, u.created_at
      ORDER BY u.created_at DESC
    `, []);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user role
router.put('/users/:id/role', adminAuth, async (req, res) => {
  const { role } = req.body;
  try {
    await dbRun('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    res.json({ message: 'Role updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    await dbRun('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Analytics
router.get('/analytics', adminAuth, async (req, res) => {
  try {
    const types = await dbAll(
      'SELECT infrastructure_type, COUNT(*) as count FROM reports GROUP BY infrastructure_type',
      []
    );
    const monthly = await dbAll(
      isProduction
        ? `SELECT TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*) as count FROM reports GROUP BY month ORDER BY month ASC LIMIT 6`
        : `SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count FROM reports GROUP BY month ORDER BY month ASC LIMIT 6`,
      []
    );
    const locations = await dbAll(`
      SELECT location, AVG(latitude) as latitude, AVG(longitude) as longitude, COUNT(*) as count
      FROM reports GROUP BY location ORDER BY count DESC LIMIT 10
    `, []);
    res.json({ types, monthly, locations });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Broadcast email
router.post('/broadcast', adminAuth, async (req, res) => {
  const { subject, message, audience, forum_category, forum_post_id } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ error: 'Subject and message are required' });
  }

  let query = '';
  let params = [];

  switch (audience) {
    case 'all':
      query = 'SELECT DISTINCT email, full_name FROM users';
      break;
    case 'admins':
      query = "SELECT DISTINCT email, full_name FROM users WHERE role = 'admin'";
      break;
    case 'forum_participants':
      query = `
        SELECT DISTINCT u.email, u.full_name FROM users u
        WHERE u.id IN (
          SELECT user_id FROM forum_posts
          UNION
          SELECT user_id FROM forum_replies
        )
      `;
      break;
    case 'forum_category':
      if (!forum_category) return res.status(400).json({ error: 'Forum category is required' });
      query = `
        SELECT DISTINCT u.email, u.full_name FROM users u
        WHERE u.id IN (
          SELECT fp.user_id FROM forum_posts fp WHERE fp.category = ?
          UNION
          SELECT fr.user_id FROM forum_replies fr
          JOIN forum_posts fp ON fr.post_id = fp.id
          WHERE fp.category = ?
        )
      `;
      params = [forum_category, forum_category];
      break;
    case 'specific_post':
      if (!forum_post_id) return res.status(400).json({ error: 'Forum post ID is required' });
      query = `
        SELECT DISTINCT u.email, u.full_name FROM users u
        WHERE u.id IN (
          SELECT user_id FROM forum_posts WHERE id = ?
          UNION
          SELECT user_id FROM forum_replies WHERE post_id = ?
        )
      `;
      params = [forum_post_id, forum_post_id];
      break;
    case 'event_rsvp':
      query = `
        SELECT DISTINCT u.email, u.full_name FROM users u
        JOIN forum_poll_votes fpv ON fpv.user_id = u.id
      `;
      break;
    case 'subscribed':
    default:
      query = 'SELECT DISTINCT email, full_name FROM users WHERE email_notifications = 1';
      break;
  }

  try {
    const users = await dbAll(query, params);
    if (users.length === 0) {
      return res.json({ message: 'No users found for this audience', sent: 0 });
    }
    let sent = 0;
    let failed = 0;
    for (const user of users) {
      try {
        await sendBroadcastEmail(user.email, user.full_name, subject, message);
        sent++;
      } catch (e) {
        console.error('Broadcast email failed for', user.email, e.message);
        failed++;
      }
    }
    res.json({
      message: `Broadcast sent to ${sent} user${sent !== 1 ? 's' : ''}${failed > 0 ? ` (${failed} failed)` : ''}`,
      sent,
      failed
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get forum posts for admin
router.get('/forum', adminAuth, async (req, res) => {
  try {
    const rows = await dbAll(`
      SELECT fp.*, u.full_name, u.email, COUNT(fr.id) as reply_count
      FROM forum_posts fp
      JOIN users u ON fp.user_id = u.id
      LEFT JOIN forum_replies fr ON fr.post_id = fp.id
      GROUP BY fp.id, u.full_name, u.email
      ORDER BY fp.is_flagged DESC, fp.is_pinned DESC, fp.created_at DESC
    `, []);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get flagged content
router.get('/forum/flagged', adminAuth, async (req, res) => {
  try {
    const posts = await dbAll(`
      SELECT fp.*, u.full_name, u.email, COUNT(fr.id) as reply_count
      FROM forum_posts fp
      JOIN users u ON fp.user_id = u.id
      LEFT JOIN forum_replies fr ON fr.post_id = fp.id
      WHERE fp.is_flagged = 1
      GROUP BY fp.id, u.full_name, u.email
      ORDER BY fp.created_at DESC
    `, []);
    const replies = await dbAll(`
      SELECT fr.*, u.full_name, u.email, fp.title as post_title
      FROM forum_replies fr
      JOIN users u ON fr.user_id = u.id
      JOIN forum_posts fp ON fr.post_id = fp.id
      WHERE fr.is_flagged = 1
      ORDER BY fr.created_at DESC
    `, []);
    res.json({ posts, replies });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete forum post
router.delete('/forum/:id', adminAuth, async (req, res) => {
  try {
    await dbRun('DELETE FROM forum_replies WHERE post_id = ?', [req.params.id]);
    await dbRun('DELETE FROM forum_posts WHERE id = ?', [req.params.id]);
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete forum reply
router.delete('/forum/:postId/replies/:replyId', adminAuth, async (req, res) => {
  try {
    await dbRun('DELETE FROM forum_replies WHERE id = ?', [req.params.replyId]);
    res.json({ message: 'Reply deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Lock/unlock thread
router.put('/forum/:id/lock', adminAuth, async (req, res) => {
  try {
    const post = await dbGet('SELECT is_locked FROM forum_posts WHERE id = ?', [req.params.id]);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const newVal = post.is_locked ? 0 : 1;
    await dbRun('UPDATE forum_posts SET is_locked = ? WHERE id = ?', [newVal, req.params.id]);
    res.json({ is_locked: newVal, message: newVal ? 'Thread locked' : 'Thread unlocked' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Pin/unpin thread
router.put('/forum/:id/pin', adminAuth, async (req, res) => {
  try {
    const post = await dbGet('SELECT is_pinned FROM forum_posts WHERE id = ?', [req.params.id]);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const newVal = post.is_pinned ? 0 : 1;
    await dbRun('UPDATE forum_posts SET is_pinned = ? WHERE id = ?', [newVal, req.params.id]);
    res.json({ is_pinned: newVal, message: newVal ? 'Thread pinned' : 'Thread unpinned' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Unflag post
router.put('/forum/:id/unflag', adminAuth, async (req, res) => {
  try {
    await dbRun('UPDATE forum_posts SET is_flagged = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Flag cleared' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Unflag reply
router.put('/forum/:postId/replies/:replyId/unflag', adminAuth, async (req, res) => {
  try {
    await dbRun('UPDATE forum_replies SET is_flagged = 0 WHERE id = ?', [req.params.replyId]);
    res.json({ message: 'Flag cleared' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;