const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');
const forumRoutes = require('./routes/forum');
const adminRoutes = require('./routes/admin');
const searchRoutes = require('./routes/search');

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/search', searchRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'GreenGaps API is running!' });
});

// Run migrations
const runMigrations = async () => {
  if (process.env.DATABASE_URL) {
    const { pool } = require('./config/database');
    try {
      await pool.query('ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS images TEXT');
      await pool.query('ALTER TABLE forum_replies ADD COLUMN IF NOT EXISTS images TEXT');
      await pool.query(`CREATE TABLE IF NOT EXISTS forum_reactions (
        id SERIAL PRIMARY KEY,
        post_id INTEGER,
        reply_id INTEGER,
        user_id INTEGER NOT NULL,
        reaction TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
      console.log('Migrations completed');
    } catch (err) {
      console.error('Migration error:', err.message);
    }
  }
};
runMigrations();

app.get('/api/make-admin/:email', async (req, res) => {
  if (process.env.DATABASE_URL) {
    const { pool } = require('./config/database');
    try {
      await pool.query("UPDATE users SET role = 'admin' WHERE email = $1", [req.params.email]);
      res.json({ message: 'Done! User is now admin.' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});