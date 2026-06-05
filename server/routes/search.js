const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/', (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    return res.json({ reports: [], posts: [] });
  }

  const search = `%${q.trim()}%`;

  db.all(`
    SELECT reports.*, users.full_name
    FROM reports
    JOIN users ON reports.user_id = users.id
    WHERE reports.location LIKE ?
      OR reports.infrastructure_type LIKE ?
      OR reports.description LIKE ?
    ORDER BY reports.created_at DESC
    LIMIT 10
  `, [search, search, search], (err, reports) => {
    if (err) return res.status(500).json({ error: 'Server error' });

    db.all(`
      SELECT fp.*, u.full_name,
        COUNT(fr.id) as reply_count
      FROM forum_posts fp
      JOIN users u ON fp.user_id = u.id
      LEFT JOIN forum_replies fr ON fr.post_id = fp.id
      WHERE fp.title LIKE ?
        OR fp.content LIKE ?
      GROUP BY fp.id
      ORDER BY fp.created_at DESC
      LIMIT 10
    `, [search, search], (err, posts) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ reports, posts });
    });
  });
});

module.exports = router;