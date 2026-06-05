const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');
const { sendPasswordResetEmail } = require('../config/email');

// Register
router.post('/register', (req, res) => {
  const { full_name, email, password } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    'INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)',
    [full_name, email, hashedPassword],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Email already registered' });
        }
        return res.status(500).json({ error: 'Server error' });
      }
      const token = jwt.sign(
        { id: this.lastID, role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      res.json({ token, user: { id: this.lastID, full_name, email, role: 'user' } });
    }
  );
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, role: user.role || 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role || 'user'
      }
    });
  });
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    // Find user
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    // Invalidate old tokens
    await new Promise((resolve) => {
      db.run('UPDATE password_reset_tokens SET used = 1 WHERE user_id = ?', [user.id], resolve);
    });

    // Save new token
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [user.id, token, expiresAt],
        (err) => { if (err) reject(err); else resolve(); }
      );
    });

    const resetLink = `http://localhost:3000/reset-password/${token}`;
    await sendPasswordResetEmail(user.email, resetLink);
    console.log('Reset email sent to:', user.email);
    res.json({ message: 'If that email exists, a reset link has been sent.' });

  } catch (err) {
    console.error('Forgot password error:', err.message);
    res.status(500).json({ error: 'Failed to send email: ' + err.message });
  }
});

// Reset Password
router.post('/reset-password', (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: 'Token and password are required' });
  }

  db.get(
    'SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0',
    [token],
    (err, resetToken) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      if (!resetToken) return res.status(400).json({ error: 'Invalid or expired reset link' });

      if (new Date() > new Date(resetToken.expires_at)) {
        return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });
      }

      const hashedPassword = bcrypt.hashSync(password, 10);

      db.run(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, resetToken.user_id],
        (err) => {
          if (err) return res.status(500).json({ error: 'Server error' });
          db.run('UPDATE password_reset_tokens SET used = 1 WHERE id = ?', [resetToken.id]);
          res.json({ message: 'Password reset successfully' });
        }
      );
    }
  );
});

// Verify reset token
router.get('/reset-password/:token', (req, res) => {
  db.get(
    'SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0',
    [req.params.token],
    (err, resetToken) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      if (!resetToken) return res.status(400).json({ error: 'Invalid or expired reset link' });
      if (new Date() > new Date(resetToken.expires_at)) {
        return res.status(400).json({ error: 'Reset link has expired' });
      }
      res.json({ valid: true });
    }
  );
});

module.exports = router;