const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Setup multer storage
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

// Get user profile
router.get('/profile', auth, (req, res) => {
  db.get(`
    SELECT 
      u.id, u.full_name, u.email, u.phone, u.profile_picture,
      u.email_notifications, u.status_notifications, u.weekly_digest, u.created_at,
      COUNT(r.id) as total_reports,
      SUM(CASE WHEN r.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN r.status = 'resolved' THEN 1 ELSE 0 END) as resolved
    FROM users u
    LEFT JOIN reports r ON r.user_id = u.id
    WHERE u.id = ?
    GROUP BY u.id
  `, [req.user.id], (err, user) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });
});

// Update user profile
router.put('/profile', auth, (req, res) => {
  const { full_name, email, phone, email_notifications, status_notifications, weekly_digest } = req.body;
  db.run(
    'UPDATE users SET full_name = ?, email = ?, phone = ?, email_notifications = ?, status_notifications = ?, weekly_digest = ? WHERE id = ?',
    [full_name, email, phone, email_notifications, status_notifications, weekly_digest, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ message: 'Profile updated successfully' });
    }
  );
});

// Upload profile picture
router.post('/profile/picture', auth, upload.single('picture'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const picturePath = `/uploads/${req.file.filename}`;

  db.run('UPDATE users SET profile_picture = ? WHERE id = ?', [picturePath, req.user.id], (err) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json({ profile_picture: picturePath });
  });
});

// Delete account
router.delete('/profile', auth, async (req, res) => {
  const { password } = req.body;
  const userId = req.user.id;

  try {
    // Verify password
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Incorrect password' });

    // Delete all user data
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM notifications WHERE user_id = ?', [userId], (err) => {
        if (err) reject(err); else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      db.run('DELETE FROM forum_replies WHERE user_id = ?', [userId], (err) => {
        if (err) reject(err); else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      db.run('DELETE FROM forum_posts WHERE user_id = ?', [userId], (err) => {
        if (err) reject(err); else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      db.run('DELETE FROM password_reset_tokens WHERE user_id = ?', [userId], (err) => {
        if (err) reject(err); else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      db.run('DELETE FROM reports WHERE user_id = ?', [userId], (err) => {
        if (err) reject(err); else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      db.run('DELETE FROM users WHERE id = ?', [userId], (err) => {
        if (err) reject(err); else resolve();
      });
    });

    res.json({ message: 'Account deleted successfully' });

  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get notifications
router.get('/notifications', auth, (req, res) => {
  db.all('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(rows);
  });
});

// Mark notification as read
router.put('/notifications/:id/read', auth, (req, res) => {
  db.run('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json({ message: 'Notification marked as read' });
  });
});

// Mark all notifications as read
router.put('/notifications/read-all', auth, (req, res) => {
  db.run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id], (err) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json({ message: 'All notifications marked as read' });
  });
});

// Public stats endpoint for home page
router.get('/stats', (req, res) => {
  db.get('SELECT COUNT(*) as total_users FROM users', [], (err, row) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json({ total_users: row.total_users });
  });
});

module.exports = router;