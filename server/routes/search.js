const express = require('express');
const router = express.Router();
const { db, pool, isProduction } = require('../config/database');

// Helper functions
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

router.get('/', async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    return res.json({ reports: [], posts: [] });
  }

  const search = `%${q.trim()}%`;

  try {
    const reports = await dbAll(`
      SELECT reports.*, users.full_name
      FROM reports
      JOIN users ON reports.user_id = users.id
      WHERE reports.location LIKE ?
        OR reports.infrastructure_type LIKE ?
        OR reports.description LIKE ?
      ORDER BY reports.created_at DESC
      LIMIT 10
    `, [search, search, search]);

    const posts = await dbAll(`
      SELECT fp.*, u.full_name,
        COUNT(fr.id) as reply_count
      FROM forum_posts fp
      JOIN users u ON fp.user_id = u.id
      LEFT JOIN forum_replies fr ON fr.post_id = fp.id
      WHERE fp.title LIKE ?
        OR fp.content LIKE ?
      GROUP BY fp.id, u.full_name
      ORDER BY fp.created_at DESC
      LIMIT 10
    `, [search, search]);

    res.json({ reports, posts });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;