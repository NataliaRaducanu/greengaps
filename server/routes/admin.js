const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { adminAuth } = require('../middleware/auth');
const { sendStatusUpdateEmail, sendBroadcastEmail } = require('../config/email');

router.get('/stats', adminAuth, (req, res) => {
  db.get(`
    SELECT
      COUNT(*) as total_reports,
      SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved
    FROM reports
  `, [], (err, stats) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    db.get('SELECT COUNT(*) as total_users FROM users', [], (err, users) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      db.all('SELECT priority, COUNT(*) as count FROM reports GROUP BY priority', [], (err, priority) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        db.all(`
          SELECT reports.*, users.full_name 
          FROM reports 
          JOIN users ON reports.user_id = users.id 
          ORDER BY reports.created_at DESC LIMIT 5
        `, [], (err, recent) => {
          if (err) return res.status(500).json({ error: 'Server error' });
          res.json({ stats, users, priority, recent });
        });
      });
    });
  });
});

router.get('/reports', adminAuth, (req, res) => {
  db.all(`
    SELECT reports.*, users.full_name, users.email
    FROM reports
    JOIN users ON reports.user_id = users.id
    ORDER BY reports.created_at DESC
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(rows);
  });
});

router.get('/reports/:id', adminAuth, (req, res) => {
  db.get(`
    SELECT reports.*, users.full_name, users.email
    FROM reports
    JOIN users ON reports.user_id = users.id
    WHERE reports.id = ?
  `, [req.params.id], (err, report) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (!report) return res.status(404).json({ error: 'Report not found' });
    db.all('SELECT * FROM status_updates WHERE report_id = ? ORDER BY created_at DESC',
      [req.params.id], (err, updates) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        res.json({ ...report, status_updates: updates });
      });
  });
});

router.put('/reports/:id/status', adminAuth, (req, res) => {
  const { status, comment, sendNotification } = req.body;

  db.run('UPDATE reports SET status = ? WHERE id = ?', [status, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: 'Server error' });

    db.run('INSERT INTO status_updates (report_id, status, comment, updated_by) VALUES (?, ?, ?, ?)',
      [req.params.id, status, comment, 'Admin']);

    db.get(`
      SELECT reports.user_id, reports.location, users.email, users.full_name
      FROM reports
      JOIN users ON reports.user_id = users.id
      WHERE reports.id = ?
    `, [req.params.id], (err, report) => {
      if (report) {
        db.run('INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
          [report.user_id, 'Report Status Updated',
            `Your report for ${report.location} has been updated to: ${status}. ${comment}`]);

        if (sendNotification !== false) {
          sendStatusUpdateEmail(report.email, report.full_name, report.location, status, comment)
            .then(() => console.log('✅ Status update email sent to', report.email))
            .catch(err => console.error('❌ Email error:', err));
        }
      }
    });

    res.json({ message: 'Status updated successfully' });
  });
});

router.get('/users', adminAuth, (req, res) => {
  db.all(`
    SELECT u.id, u.full_name, u.email, u.role, u.created_at,
      COUNT(r.id) as report_count
    FROM users u
    LEFT JOIN reports r ON r.user_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(rows);
  });
});

router.put('/users/:id/role', adminAuth, (req, res) => {
  const { role } = req.body;
  db.run('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json({ message: 'Role updated successfully' });
  });
});

router.delete('/users/:id', adminAuth, (req, res) => {
  db.run('DELETE FROM users WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json({ message: 'User deleted successfully' });
  });
});

router.get('/analytics', adminAuth, (req, res) => {
  db.all('SELECT infrastructure_type, COUNT(*) as count FROM reports GROUP BY infrastructure_type', [], (err, types) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    db.all(`
      SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
      FROM reports GROUP BY month ORDER BY month ASC LIMIT 6
    `, [], (err, monthly) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      db.all(`
        SELECT location, AVG(latitude) as latitude, AVG(longitude) as longitude, COUNT(*) as count
        FROM reports GROUP BY location ORDER BY count DESC LIMIT 10
      `, [], (err, locations) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        res.json({ types, monthly, locations });
      });
    });
  });
});

// ─── BROADCAST EMAIL ─────────────────────────────────────────

router.post('/broadcast', adminAuth, (req, res) => {
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
      if (!forum_category) {
        return res.status(400).json({ error: 'Forum category is required' });
      }
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
      if (!forum_post_id) {
        return res.status(400).json({ error: 'Forum post ID is required' });
      }
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

  db.all(query, params, async (err, users) => {
    if (err) return res.status(500).json({ error: 'Server error' });
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
        console.error('❌ Broadcast email failed for', user.email, e.message);
        failed++;
      }
    }

    res.json({
      message: `Broadcast sent to ${sent} user${sent !== 1 ? 's' : ''}${failed > 0 ? ` (${failed} failed)` : ''}`,
      sent,
      failed
    });
  });
});

// ─── FORUM MODERATION ─────────────────────────────────────────

router.get('/forum', adminAuth, (req, res) => {
  db.all(`
    SELECT fp.*, u.full_name, u.email, COUNT(fr.id) as reply_count
    FROM forum_posts fp
    JOIN users u ON fp.user_id = u.id
    LEFT JOIN forum_replies fr ON fr.post_id = fp.id
    GROUP BY fp.id
    ORDER BY fp.is_flagged DESC, fp.is_pinned DESC, fp.created_at DESC
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(rows);
  });
});

router.get('/forum/flagged', adminAuth, (req, res) => {
  db.all(`
    SELECT fp.*, u.full_name, u.email, COUNT(fr.id) as reply_count
    FROM forum_posts fp
    JOIN users u ON fp.user_id = u.id
    LEFT JOIN forum_replies fr ON fr.post_id = fp.id
    WHERE fp.is_flagged = 1
    GROUP BY fp.id
    ORDER BY fp.created_at DESC
  `, [], (err, posts) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    db.all(`
      SELECT fr.*, u.full_name, u.email, fp.title as post_title
      FROM forum_replies fr
      JOIN users u ON fr.user_id = u.id
      JOIN forum_posts fp ON fr.post_id = fp.id
      WHERE fr.is_flagged = 1
      ORDER BY fr.created_at DESC
    `, [], (err, replies) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ posts, replies });
    });
  });
});

router.delete('/forum/:id', adminAuth, (req, res) => {
  db.run('DELETE FROM forum_replies WHERE post_id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    db.run('DELETE FROM forum_posts WHERE id = ?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ message: 'Post deleted successfully' });
    });
  });
});

router.delete('/forum/:postId/replies/:replyId', adminAuth, (req, res) => {
  db.run('DELETE FROM forum_replies WHERE id = ?', [req.params.replyId], (err) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json({ message: 'Reply deleted successfully' });
  });
});

router.put('/forum/:id/lock', adminAuth, (req, res) => {
  db.get('SELECT is_locked FROM forum_posts WHERE id = ?', [req.params.id], (err, post) => {
    if (err || !post) return res.status(500).json({ error: 'Server error' });
    const newVal = post.is_locked ? 0 : 1;
    db.run('UPDATE forum_posts SET is_locked = ? WHERE id = ?', [newVal, req.params.id], (err) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ is_locked: newVal, message: newVal ? 'Thread locked' : 'Thread unlocked' });
    });
  });
});

router.put('/forum/:id/pin', adminAuth, (req, res) => {
  db.get('SELECT is_pinned FROM forum_posts WHERE id = ?', [req.params.id], (err, post) => {
    if (err || !post) return res.status(500).json({ error: 'Server error' });
    const newVal = post.is_pinned ? 0 : 1;
    db.run('UPDATE forum_posts SET is_pinned = ? WHERE id = ?', [newVal, req.params.id], (err) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ is_pinned: newVal, message: newVal ? 'Thread pinned' : 'Thread unpinned' });
    });
  });
});

router.put('/forum/:id/unflag', adminAuth, (req, res) => {
  db.run('UPDATE forum_posts SET is_flagged = 0 WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json({ message: 'Flag cleared' });
  });
});

router.put('/forum/:postId/replies/:replyId/unflag', adminAuth, (req, res) => {
  db.run('UPDATE forum_replies SET is_flagged = 0 WHERE id = ?', [req.params.replyId], (err) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json({ message: 'Flag cleared' });
  });
});

module.exports = router;