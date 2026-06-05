const express = require('express');
const router = express.Router();
const { db, pool, isProduction } = require('../config/database');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sendForumReplyEmail } = require('../config/email');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'forum');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `forum_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Images only'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

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

// Get all posts
router.get('/', async (req, res) => {
  try {
    const rows = await dbAll(`
      SELECT 
        fp.*, 
        u.full_name,
        u.profile_picture,
        COUNT(fr.id) as reply_count
      FROM forum_posts fp
      JOIN users u ON fp.user_id = u.id
      LEFT JOIN forum_replies fr ON fr.post_id = fp.id
      GROUP BY fp.id, u.full_name, u.profile_picture
      ORDER BY fp.is_pinned DESC, fp.created_at DESC
    `, []);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single post with replies and reactions
router.get('/:id', async (req, res) => {
  const userId = req.headers.authorization
    ? (() => {
        try {
          const token = req.headers.authorization.split(' ')[1];
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'greengaps_secret');
          return decoded.id;
        } catch { return null; }
      })()
    : null;

  try {
    const post = await dbGet(`
      SELECT fp.*, u.full_name, u.profile_picture
      FROM forum_posts fp
      JOIN users u ON fp.user_id = u.id
      WHERE fp.id = ?
    `, [req.params.id]);

    if (!post) return res.status(404).json({ error: 'Post not found' });

    const postReactions = await dbAll(
      `SELECT reaction, COUNT(*) as count FROM forum_reactions WHERE post_id = ? GROUP BY reaction`,
      [req.params.id]
    );
    const reactionMap = {};
    postReactions.forEach(r => reactionMap[r.reaction] = r.count);

    const userPostReactions = await dbAll(
      `SELECT reaction FROM forum_reactions WHERE post_id = ? AND user_id = ?`,
      [req.params.id, userId || 0]
    );
    const userReacted = {};
    userPostReactions.forEach(r => userReacted[r.reaction] = true);

    const replies = await dbAll(`
      SELECT fr.*, u.full_name, u.profile_picture
      FROM forum_replies fr
      JOIN users u ON fr.user_id = u.id
      WHERE fr.post_id = ?
      ORDER BY fr.created_at ASC
    `, [req.params.id]);

    if (replies.length === 0) {
      return res.json({
        ...post,
        reactions: reactionMap,
        user_reactions: userReacted,
        replies: []
      });
    }

    const replyIds = replies.map(r => r.id);
    const placeholders = replyIds.map((_, i) => isProduction ? `$${i + 1}` : '?').join(',');

    const replyReactions = await dbAll(
      `SELECT reply_id, reaction, COUNT(*) as count FROM forum_reactions WHERE reply_id IN (${placeholders}) GROUP BY reply_id, reaction`,
      replyIds
    );
    const replyReactionMap = {};
    replyReactions.forEach(r => {
      if (!replyReactionMap[r.reply_id]) replyReactionMap[r.reply_id] = {};
      replyReactionMap[r.reply_id][r.reaction] = r.count;
    });

    const userReplyReactions = await dbAll(
      `SELECT reply_id, reaction FROM forum_reactions WHERE reply_id IN (${placeholders}) AND user_id = ?`,
      [...replyIds, userId || 0]
    );
    const userReplyReactionMap = {};
    userReplyReactions.forEach(r => {
      if (!userReplyReactionMap[r.reply_id]) userReplyReactionMap[r.reply_id] = {};
      userReplyReactionMap[r.reply_id][r.reaction] = true;
    });

    const enrichedReplies = replies.map(r => ({
      ...r,
      reactions: replyReactionMap[r.id] || {},
      user_reactions: userReplyReactionMap[r.id] || {}
    }));

    res.json({
      ...post,
      reactions: reactionMap,
      user_reactions: userReacted,
      replies: enrichedReplies
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create post
router.post('/', auth, upload.array('images', 3), async (req, res) => {
  const { title, content, category } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content are required' });

  const images = req.files && req.files.length > 0
    ? JSON.stringify(req.files.map(f => `/uploads/forum/${f.filename}`))
    : null;

  try {
    const result = await dbInsert(
      'INSERT INTO forum_posts (user_id, title, content, category, images) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, title, content, category || 'General', images]
    );
    res.json({ id: result.lastID, message: 'Post created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create reply
router.post('/:id/replies', auth, upload.array('images', 3), async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content is required' });

  try {
    const post = await dbGet('SELECT is_locked FROM forum_posts WHERE id = ?', [req.params.id]);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.is_locked) return res.status(403).json({ error: 'This thread is locked' });

    const images = req.files && req.files.length > 0
      ? JSON.stringify(req.files.map(f => `/uploads/forum/${f.filename}`))
      : null;

    const result = await dbInsert(
      'INSERT INTO forum_replies (post_id, user_id, content, images) VALUES (?, ?, ?, ?)',
      [req.params.id, req.user.id, content, images]
    );

    const data = await dbGet(`
      SELECT fp.title, fp.user_id, u.email, u.full_name, u.email_notifications,
             r.full_name as replier_name
      FROM forum_posts fp
      JOIN users u ON fp.user_id = u.id
      JOIN users r ON r.id = ?
      WHERE fp.id = ?
    `, [req.user.id, req.params.id]);

    if (data && data.user_id !== req.user.id && data.email_notifications) {
      sendForumReplyEmail(
        data.email,
        data.full_name,
        data.title,
        data.replier_name,
        content,
        req.params.id
      )
      .then(() => console.log('Forum reply email sent to', data.email))
      .catch(err => console.error('Forum reply email error:', err));
    }

    res.json({ id: result.lastID, message: 'Reply added successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete post
router.delete('/:id', auth, async (req, res) => {
  try {
    await dbRun('DELETE FROM forum_posts WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete reply
router.delete('/:id/replies/:replyId', auth, async (req, res) => {
  try {
    await dbRun('DELETE FROM forum_replies WHERE id = ? AND user_id = ?', [req.params.replyId, req.user.id]);
    res.json({ message: 'Reply deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Flag post
router.post('/:id/flag', auth, async (req, res) => {
  try {
    await dbRun('UPDATE forum_posts SET is_flagged = 1 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Post flagged for review' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Flag reply
router.post('/:id/replies/:replyId/flag', auth, async (req, res) => {
  try {
    await dbRun('UPDATE forum_replies SET is_flagged = 1 WHERE id = ?', [req.params.replyId]);
    res.json({ message: 'Reply flagged for review' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// React to post
router.post('/:id/react', auth, async (req, res) => {
  const { reaction } = req.body;
  if (!['helpful', 'agree'].includes(reaction)) {
    return res.status(400).json({ error: 'Invalid reaction' });
  }
  try {
    const existing = await dbGet(
      'SELECT id FROM forum_reactions WHERE post_id = ? AND user_id = ? AND reaction = ?',
      [req.params.id, req.user.id, reaction]
    );
    if (existing) {
      await dbRun('DELETE FROM forum_reactions WHERE id = ?', [existing.id]);
      res.json({ reacted: false, reaction });
    } else {
      await dbRun(
        'INSERT INTO forum_reactions (post_id, user_id, reaction) VALUES (?, ?, ?)',
        [req.params.id, req.user.id, reaction]
      );
      res.json({ reacted: true, reaction });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// React to reply
router.post('/:id/replies/:replyId/react', auth, async (req, res) => {
  const { reaction } = req.body;
  if (!['helpful', 'agree'].includes(reaction)) {
    return res.status(400).json({ error: 'Invalid reaction' });
  }
  try {
    const existing = await dbGet(
      'SELECT id FROM forum_reactions WHERE reply_id = ? AND user_id = ? AND reaction = ?',
      [req.params.replyId, req.user.id, reaction]
    );
    if (existing) {
      await dbRun('DELETE FROM forum_reactions WHERE id = ?', [existing.id]);
      res.json({ reacted: false, reaction });
    } else {
      await dbRun(
        'INSERT INTO forum_reactions (reply_id, user_id, reaction) VALUES (?, ?, ?)',
        [req.params.replyId, req.user.id, reaction]
      );
      res.json({ reacted: true, reaction });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get poll votes
router.get('/:id/poll', async (req, res) => {
  const userId = req.headers.authorization
    ? (() => {
        try {
          const token = req.headers.authorization.split(' ')[1];
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'greengaps_secret');
          return decoded.id;
        } catch { return null; }
      })()
    : null;

  try {
    const row = await dbGet(
      'SELECT COUNT(*) as count FROM forum_poll_votes WHERE post_id = ?',
      [req.params.id]
    );
    if (!userId) return res.json({ count: row.count, voted: false });

    const existing = await dbGet(
      'SELECT id FROM forum_poll_votes WHERE post_id = ? AND user_id = ?',
      [req.params.id, userId]
    );
    res.json({ count: row.count, voted: !!existing });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Vote on poll
router.post('/:id/poll/vote', auth, async (req, res) => {
  try {
    const existing = await dbGet(
      'SELECT id FROM forum_poll_votes WHERE post_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (existing) {
      await dbRun('DELETE FROM forum_poll_votes WHERE id = ?', [existing.id]);
      const row = await dbGet('SELECT COUNT(*) as count FROM forum_poll_votes WHERE post_id = ?', [req.params.id]);
      res.json({ voted: false, count: row.count });
    } else {
      await dbInsert('INSERT INTO forum_poll_votes (post_id, user_id) VALUES (?, ?)', [req.params.id, req.user.id]);
      const row = await dbGet('SELECT COUNT(*) as count FROM forum_poll_votes WHERE post_id = ?', [req.params.id]);
      res.json({ voted: true, count: row.count });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;