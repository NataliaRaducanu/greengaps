const express = require('express');
const router = express.Router();
const { db, pool, isProduction } = require('../config/database');
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

// Get all reports with upvote counts
router.get('/', async (req, res) => {
  try {
    const rows = await dbAll(`
      SELECT reports.*, users.full_name,
        COUNT(DISTINCT rv.id) as upvote_count
      FROM reports
      JOIN users ON reports.user_id = users.id
      LEFT JOIN report_upvotes rv ON rv.report_id = reports.id
      GROUP BY reports.id, users.full_name
      ORDER BY reports.created_at DESC
    `, []);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's reports with upvote counts
router.get('/my', auth, async (req, res) => {
  try {
    const rows = await dbAll(`
      SELECT reports.*,
        COUNT(DISTINCT rv.id) as upvote_count,
        MAX(CASE WHEN rv.user_id = ? THEN 1 ELSE 0 END) as user_upvoted
      FROM reports
      LEFT JOIN report_upvotes rv ON rv.report_id = reports.id
      WHERE reports.user_id = ?
      GROUP BY reports.id
      ORDER BY reports.created_at DESC
    `, [req.user.id, req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single report with status updates, photos and upvotes
router.get('/:id', auth, async (req, res) => {
  try {
    const report = await dbGet(`
      SELECT reports.*, users.full_name,
        COUNT(DISTINCT rv.id) as upvote_count,
        MAX(CASE WHEN rv.user_id = ? THEN 1 ELSE 0 END) as user_upvoted
      FROM reports
      JOIN users ON reports.user_id = users.id
      LEFT JOIN report_upvotes rv ON rv.report_id = reports.id
      WHERE reports.id = ?
      GROUP BY reports.id, users.full_name
    `, [req.user.id, req.params.id]);

    if (!report) return res.status(404).json({ error: 'Report not found' });

    const updates = await dbAll(
      'SELECT * FROM status_updates WHERE report_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );
    const photos = await dbAll(
      'SELECT * FROM report_photos WHERE report_id = ? ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json({ ...report, status_updates: updates, photos });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create report with optional photos
router.post('/', auth, upload.array('photos', 3), async (req, res) => {
  const { infrastructure_type, location, latitude, longitude, priority, description } = req.body;

  if (!infrastructure_type || !location || !latitude || !longitude || !priority || !description) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const result = await dbInsert(
      'INSERT INTO reports (user_id, infrastructure_type, location, latitude, longitude, priority, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, infrastructure_type, location, latitude, longitude, priority, description]
    );
    const reportId = result.lastID;

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await dbRun('INSERT INTO report_photos (report_id, filename) VALUES (?, ?)',
          [reportId, `/uploads/reports/${file.filename}`]);
      }
    }

    await dbRun(
      'INSERT INTO status_updates (report_id, status, comment, updated_by) VALUES (?, ?, ?, ?)',
      [reportId, 'Open', 'Report received and validated. Thank you for your submission!', 'System']
    );

    await dbRun(
      'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
      [req.user.id, 'Report Submitted Successfully',
        `Your report for ${location} has been submitted and is under review`]
    );

    res.json({ id: reportId, message: 'Report created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update report
router.put('/:id', auth, async (req, res) => {
  const { infrastructure_type, location, priority, description } = req.body;
  try {
    await dbRun(
      'UPDATE reports SET infrastructure_type = ?, location = ?, priority = ?, description = ? WHERE id = ? AND user_id = ?',
      [infrastructure_type, location, priority, description, req.params.id, req.user.id]
    );
    res.json({ message: 'Report updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle upvote on a report
router.post('/:id/upvote', auth, async (req, res) => {
  try {
    const existing = await dbGet(
      'SELECT id FROM report_upvotes WHERE report_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (existing) {
      await dbRun('DELETE FROM report_upvotes WHERE report_id = ? AND user_id = ?',
        [req.params.id, req.user.id]);
      const row = await dbGet('SELECT COUNT(*) as count FROM report_upvotes WHERE report_id = ?',
        [req.params.id]);
      res.json({ upvoted: false, upvote_count: row?.count || 0 });
    } else {
      await dbInsert('INSERT INTO report_upvotes (report_id, user_id) VALUES (?, ?)',
        [req.params.id, req.user.id]);
      const row = await dbGet('SELECT COUNT(*) as count FROM report_upvotes WHERE report_id = ?',
        [req.params.id]);
      res.json({ upvoted: true, upvote_count: row?.count || 0 });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get upvote status for a report
router.get('/:id/upvote', auth, async (req, res) => {
  try {
    const existing = await dbGet(
      'SELECT id FROM report_upvotes WHERE report_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    const row = await dbGet(
      'SELECT COUNT(*) as count FROM report_upvotes WHERE report_id = ?',
      [req.params.id]
    );
    res.json({ upvoted: !!existing, upvote_count: row?.count || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;