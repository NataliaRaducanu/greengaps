const express = require('express');
const router = express.Router();
const db = require('../config/database');
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

router.get('/', (req, res) => {
  db.all(`
    SELECT 
      fp.*, 
      u.full_name,
      u.profile_picture,
      COUNT(fr.id) as reply_count
    FROM forum_posts fp
    JOIN users u ON fp.user_id = u.id
    LEFT JOIN forum_replies fr ON fr.post_id = fp.id
    GROUP BY fp.id
    ORDER BY fp.is_pinned DESC, fp.created_at DESC
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(rows);
  });
});

router.get('/:id', (req, res) => {
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

  db.get(`
    SELECT fp.*, u.full_name, u.profile_picture
    FROM forum_posts fp
    JOIN users u ON fp.user_id = u.id
    WHERE fp.id = ?
  `, [req.params.id], (err, post) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Get post reactions
    db.all(`SELECT reaction, COUNT(*) as count FROM forum_reactions WHERE post_id = ? GROUP BY reaction`,
      [req.params.id], (err, postReactions) => {
        const reactionMap = {};
        (postReactions || []).forEach(r => reactionMap[r.reaction] = r.count);

        // Get user's reactions on this post
        db.all(`SELECT reaction FROM forum_reactions WHERE post_id = ? AND user_id = ?`,
          [req.params.id, userId || 0], (err, userPostReactions) => {
          const userReacted = {};
          (userPostReactions || []).forEach(r => userReacted[r.reaction] = true);

          db.all(`
            SELECT fr.*, u.full_name, u.profile_picture
            FROM forum_replies fr
            JOIN users u ON fr.user_id = u.id
            WHERE fr.post_id = ?
            ORDER BY fr.created_at ASC
          `, [req.params.id], (err, replies) => {
            if (err) return res.status(500).json({ error: 'Server error' });

            const replyIds = replies.map(r => r.id);
            if (replyIds.length === 0) {
              return res.json({
                ...post,
                reactions: reactionMap,
                user_reactions: userReacted,
                replies: []
              });
            }

            db.all(`SELECT reply_id, reaction, COUNT(*) as count FROM forum_reactions WHERE reply_id IN (${replyIds.map(() => '?').join(',')}) GROUP BY reply_id, reaction`,
              replyIds, (err, replyReactions) => {
                const replyReactionMap = {};
                (replyReactions || []).forEach(r => {
                  if (!replyReactionMap[r.reply_id]) replyReactionMap[r.reply_id] = {};
                  replyReactionMap[r.reply_id][r.reaction] = r.count;
                });

                db.all(`SELECT reply_id, reaction FROM forum_reactions WHERE reply_id IN (${replyIds.map(() => '?').join(',')}) AND user_id = ?`,
                  [...replyIds, userId || 0], (err, userReplyReactions) => {
                    const userReplyReactionMap = {};
                    (userReplyReactions || []).forEach(r => {
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
                  });
              });
          });
        });
      });
  });
});

router.post('/', auth, upload.array('images', 3), (req, res) => {
  const { title, content, category } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content are required' });

  const images = req.files && req.files.length > 0
    ? JSON.stringify(req.files.map(f => `/uploads/forum/${f.filename}`))
    : null;

  db.run(
    'INSERT INTO forum_posts (user_id, title, content, category, images) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, title, content, category || 'General', images],
    function (err) {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ id: this.lastID, message: 'Post created successfully' });
    }
  );
});

router.post('/:id/replies', auth, upload.array('images', 3), (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content is required' });

  db.get('SELECT is_locked FROM forum_posts WHERE id = ?', [req.params.id], (err, post) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.is_locked) return res.status(403).json({ error: 'This thread is locked' });

    const images = req.files && req.files.length > 0
      ? JSON.stringify(req.files.map(f => `/uploads/forum/${f.filename}`))
      : null;

    db.run(
      'INSERT INTO forum_replies (post_id, user_id, content, images) VALUES (?, ?, ?, ?)',
      [req.params.id, req.user.id, content, images],
      function (err) {
        if (err) return res.status(500).json({ error: 'Server error' });

        db.get(`
          SELECT fp.title, fp.user_id, u.email, u.full_name, u.email_notifications,
                 r.full_name as replier_name
          FROM forum_posts fp
          JOIN users u ON fp.user_id = u.id
          JOIN users r ON r.id = ?
          WHERE fp.id = ?
        `, [req.user.id, req.params.id], (err, data) => {
          if (data && data.user_id !== req.user.id && data.email_notifications) {
            sendForumReplyEmail(
              data.email,
              data.full_name,
              data.title,
              data.replier_name,
              content,
              req.params.id
            )
            .then(() => console.log('✅ Forum reply email sent to', data.email))
            .catch(err => console.error('❌ Forum reply email error:', err));
          }
        });

        res.json({ id: this.lastID, message: 'Reply added successfully' });
      }
    );
  });
});

router.delete('/:id', auth, (req, res) => {
  db.run(
    'DELETE FROM forum_posts WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ message: 'Post deleted successfully' });
    }
  );
});

router.delete('/:id/replies/:replyId', auth, (req, res) => {
  db.run(
    'DELETE FROM forum_replies WHERE id = ? AND user_id = ?',
    [req.params.replyId, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ message: 'Reply deleted successfully' });
    }
  );
});

router.post('/:id/flag', auth, (req, res) => {
  db.run('UPDATE forum_posts SET is_flagged = 1 WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json({ message: 'Post flagged for review' });
  });
});

router.post('/:id/replies/:replyId/flag', auth, (req, res) => {
  db.run('UPDATE forum_replies SET is_flagged = 1 WHERE id = ?', [req.params.replyId], function (err) {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json({ message: 'Reply flagged for review' });
  });
});

// ── REACTIONS ──────────────────────────────────────────────

router.post('/:id/react', auth, (req, res) => {
  const { reaction } = req.body;
  if (!['helpful', 'agree'].includes(reaction)) {
    return res.status(400).json({ error: 'Invalid reaction' });
  }

  db.get('SELECT id FROM forum_reactions WHERE post_id = ? AND user_id = ? AND reaction = ?',
    [req.params.id, req.user.id, reaction], (err, existing) => {
      if (err) return res.status(500).json({ error: 'Server error' });

      if (existing) {
        db.run('DELETE FROM forum_reactions WHERE id = ?', [existing.id], (err) => {
          if (err) return res.status(500).json({ error: 'Server error' });
          res.json({ reacted: false, reaction });
        });
      } else {
        db.run('INSERT INTO forum_reactions (post_id, user_id, reaction) VALUES (?, ?, ?)',
          [req.params.id, req.user.id, reaction], (err) => {
            if (err) return res.status(500).json({ error: 'Server error' });
            res.json({ reacted: true, reaction });
          });
      }
    });
});

router.post('/:id/replies/:replyId/react', auth, (req, res) => {
  const { reaction } = req.body;
  if (!['helpful', 'agree'].includes(reaction)) {
    return res.status(400).json({ error: 'Invalid reaction' });
  }

  db.get('SELECT id FROM forum_reactions WHERE reply_id = ? AND user_id = ? AND reaction = ?',
    [req.params.replyId, req.user.id, reaction], (err, existing) => {
      if (err) return res.status(500).json({ error: 'Server error' });

      if (existing) {
        db.run('DELETE FROM forum_reactions WHERE id = ?', [existing.id], (err) => {
          if (err) return res.status(500).json({ error: 'Server error' });
          res.json({ reacted: false, reaction });
        });
      } else {
        db.run('INSERT INTO forum_reactions (reply_id, user_id, reaction) VALUES (?, ?, ?)',
          [req.params.replyId, req.user.id, reaction], (err) => {
            if (err) return res.status(500).json({ error: 'Server error' });
            res.json({ reacted: true, reaction });
          });
      }
    });
});

// ── POLL / RSVP (Events only) ─────────────────────────────────

router.get('/:id/poll', (req, res) => {
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

  db.get('SELECT COUNT(*) as count FROM forum_poll_votes WHERE post_id = ?',
    [req.params.id], (err, row) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      if (!userId) return res.json({ count: row.count, voted: false });

      db.get('SELECT id FROM forum_poll_votes WHERE post_id = ? AND user_id = ?',
        [req.params.id, userId], (err, existing) => {
          if (err) return res.status(500).json({ error: 'Server error' });
          res.json({ count: row.count, voted: !!existing });
        });
    });
});

router.post('/:id/poll/vote', auth, (req, res) => {
  db.get('SELECT id FROM forum_poll_votes WHERE post_id = ? AND user_id = ?',
    [req.params.id, req.user.id], (err, existing) => {
      if (err) return res.status(500).json({ error: 'Server error' });

      if (existing) {
        db.run('DELETE FROM forum_poll_votes WHERE id = ?', [existing.id], (err) => {
          if (err) return res.status(500).json({ error: 'Server error' });
          db.get('SELECT COUNT(*) as count FROM forum_poll_votes WHERE post_id = ?',
            [req.params.id], (err, row) => res.json({ voted: false, count: row.count }));
        });
      } else {
        db.run('INSERT INTO forum_poll_votes (post_id, user_id) VALUES (?, ?)',
          [req.params.id, req.user.id], (err) => {
            if (err) return res.status(500).json({ error: 'Server error' });
            db.get('SELECT COUNT(*) as count FROM forum_poll_votes WHERE post_id = ?',
              [req.params.id], (err, row) => res.json({ voted: true, count: row.count }));
          });
      }
    });
});

module.exports = router;