const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'reports');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${ext}`);
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

// Get all reports with upvote counts
router.get('/', (req, res) => {
  const userId = req.user?.id || null;
  db.all(`
    SELECT reports.*, users.full_name,
      COUNT(DISTINCT rv.id) as upvote_count
    FROM reports
    JOIN users ON reports.user_id = users.id
    LEFT JOIN report_upvotes rv ON rv.report_id = reports.id
    GROUP BY reports.id
    ORDER BY reports.created_at DESC
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(rows);
  });
});

// Get user's reports with upvote counts
router.get('/my', auth, (req, res) => {
  db.all(`
    SELECT reports.*,
      COUNT(DISTINCT rv.id) as upvote_count,
      MAX(CASE WHEN rv.user_id = ? THEN 1 ELSE 0 END) as user_upvoted
    FROM reports
    LEFT JOIN report_upvotes rv ON rv.report_id = reports.id
    WHERE reports.user_id = ?
    GROUP BY reports.id
    ORDER BY reports.created_at DESC
  `, [req.user.id, req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(rows);
  });
});

// Get single report with status updates, photos and upvotes
router.get('/:id', auth, (req, res) => {
  db.get(`
    SELECT reports.*, users.full_name,
      COUNT(DISTINCT rv.id) as upvote_count,
      MAX(CASE WHEN rv.user_id = ? THEN 1 ELSE 0 END) as user_upvoted
    FROM reports
    JOIN users ON reports.user_id = users.id
    LEFT JOIN report_upvotes rv ON rv.report_id = reports.id
    WHERE reports.id = ?
    GROUP BY reports.id
  `, [req.user.id, req.params.id], (err, report) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (!report) return res.status(404).json({ error: 'Report not found' });

    db.all('SELECT * FROM status_updates WHERE report_id = ? ORDER BY created_at DESC',
      [req.params.id], (err, updates) => {
        if (err) return res.status(500).json({ error: 'Server error' });

        db.all('SELECT * FROM report_photos WHERE report_id = ? ORDER BY created_at ASC',
          [req.params.id], (err, photos) => {
            if (err) return res.status(500).json({ error: 'Server error' });
            res.json({ ...report, status_updates: updates, photos });
          });
      });
  });
});

// Create report with optional photos
router.post('/', auth, upload.array('photos', 3), (req, res) => {
  const { infrastructure_type, location, latitude, longitude, priority, description } = req.body;

  if (!infrastructure_type || !location || !latitude || !longitude || !priority || !description) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  db.run(
    'INSERT INTO reports (user_id, infrastructure_type, location, latitude, longitude, priority, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, infrastructure_type, location, latitude, longitude, priority, description],
    function (err) {
      if (err) return res.status(500).json({ error: 'Server error' });

      const reportId = this.lastID;

      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          db.run('INSERT INTO report_photos (report_id, filename) VALUES (?, ?)',
            [reportId, `/uploads/reports/${file.filename}`]);
        });
      }

      db.run('INSERT INTO status_updates (report_id, status, comment, updated_by) VALUES (?, ?, ?, ?)',
        [reportId, 'Open', 'Report received and validated. Thank you for your submission!', 'System']);

      db.run('INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
        [req.user.id, 'Report Submitted Successfully',
          `Your report for ${location} has been submitted and is under review`]);

      res.json({ id: reportId, message: 'Report created successfully' });
    }
  );
});

// Update report
router.put('/:id', auth, (req, res) => {
  const { infrastructure_type, location, priority, description } = req.body;
  db.run(
    'UPDATE reports SET infrastructure_type = ?, location = ?, priority = ?, description = ? WHERE id = ? AND user_id = ?',
    [infrastructure_type, location, priority, description, req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ message: 'Report updated successfully' });
    }
  );
});

// ── UPVOTE ──────────────────────────────────────────────────

// Toggle upvote on a report
router.post('/:id/upvote', auth, (req, res) => {
  // Check if already upvoted
  db.get('SELECT id FROM report_upvotes WHERE report_id = ? AND user_id = ?',
    [req.params.id, req.user.id], (err, existing) => {
      if (err) return res.status(500).json({ error: 'Server error' });

      if (existing) {
        // Remove upvote
        db.run('DELETE FROM report_upvotes WHERE report_id = ? AND user_id = ?',
          [req.params.id, req.user.id], (err) => {
            if (err) return res.status(500).json({ error: 'Server error' });
            db.get('SELECT COUNT(*) as count FROM report_upvotes WHERE report_id = ?',
              [req.params.id], (err, row) => {
                res.json({ upvoted: false, upvote_count: row?.count || 0 });
              });
          });
      } else {
        // Add upvote
        db.run('INSERT INTO report_upvotes (report_id, user_id) VALUES (?, ?)',
          [req.params.id, req.user.id], (err) => {
            if (err) return res.status(500).json({ error: 'Server error' });
            db.get('SELECT COUNT(*) as count FROM report_upvotes WHERE report_id = ?',
              [req.params.id], (err, row) => {
                res.json({ upvoted: true, upvote_count: row?.count || 0 });
              });
          });
      }
    });
});

// Get upvote status for a report
router.get('/:id/upvote', auth, (req, res) => {
  db.get('SELECT id FROM report_upvotes WHERE report_id = ? AND user_id = ?',
    [req.params.id, req.user.id], (err, existing) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      db.get('SELECT COUNT(*) as count FROM report_upvotes WHERE report_id = ?',
        [req.params.id], (err, row) => {
          res.json({ upvoted: !!existing, upvote_count: row?.count || 0 });
        });
    });
});

module.exports = router;