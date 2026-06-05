const express = require('express');
const router = express.Router();
const { db, pool, isProduction } = require('../config/database');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${req.user.id}_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Images only'));
  }
});

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

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await dbGet(`
      SELECT 
        u.id, u.full_name, u.email, u.phone, u.profile_picture,
        u.email_notifications, u.status_notifications, u.weekly_digest, u.created_at,
        COUNT(r.id) as total_reports,
        SUM(CASE WHEN r.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN r.status = 'resolved' THEN 1 ELSE 0 END) as resolved
      FROM users u
      LEFT JOIN reports r ON r.user_id = u.id
      WHERE u.id = ?
      GROUP BY u.id, u.full_name, u.email, u.phone, u.profile_picture,
        u.email_notifications, u.status_notifications, u.weekly_digest, u.created_at
    `, [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  const { full_name, email, phone, email_notifications, status_notifications, weekly_digest } = req.body;
  try {
    await dbRun(
      'UPDATE users SET full_name = ?, email = ?, phone = ?, email_notifications = ?, status_notifications = ?, weekly_digest = ? WHERE id = ?',
      [full_name, email, phone, email_notifications, status_notifications, weekly_digest, req.user.id]
    );
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload profile picture
router.post('/profile/picture', auth, upload.single('picture'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const picturePath = `/uploads/${req.file.filename}`;
  try {
    await dbRun('UPDATE users SET profile_picture = ? WHERE id = ?', [picturePath, req.user.id]);
    res.json({ profile_picture: picturePath });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete account
router.delete('/profile', auth, async (req, res) => {
  const { password } = req.body;
  const userId = req.user.id;

  try {
    const user = await dbGet('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Incorrect password' });

    await dbRun('DELETE FROM notifications WHERE user_id = ?', [userId]);
    await dbRun('DELETE FROM forum_replies WHERE user_id = ?', [userId]);
    await dbRun('DELETE FROM forum_posts WHERE user_id = ?', [userId]);
    await dbRun('DELETE FROM password_reset_tokens WHERE user_id = ?', [userId]);
    await dbRun('DELETE FROM reports WHERE user_id = ?', [userId]);
    await dbRun('DELETE FROM users WHERE id = ?', [userId]);

    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get notifications
router.get('/notifications', auth, async (req, res) => {
  try {
    const rows = await dbAll(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', auth, async (req, res) => {
  try {
    await dbRun(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark all notifications as read
router.put('/notifications/read-all', auth, async (req, res) => {
  try {
    await dbRun(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [req.user.id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Public stats endpoint for home page
router.get('/stats', async (req, res) => {
  try {
    const row = await dbGet('SELECT COUNT(*) as total_users FROM users', []);
    res.json({ total_users: row.total_users });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;