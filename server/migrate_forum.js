const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'greengaps.db');
const db = new sqlite3.Database(dbPath);

const migrations = [
  `ALTER TABLE forum_posts ADD COLUMN is_locked INTEGER DEFAULT 0`,
  `ALTER TABLE forum_posts ADD COLUMN is_pinned INTEGER DEFAULT 0`,
  `ALTER TABLE forum_posts ADD COLUMN is_flagged INTEGER DEFAULT 0`,
  `ALTER TABLE forum_replies ADD COLUMN is_flagged INTEGER DEFAULT 0`,
];

db.serialize(() => {
  migrations.forEach(sql => {
    db.run(sql, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error('Migration error:', err.message);
      } else {
        console.log('✅', sql.split(' ').slice(0, 5).join(' '));
      }
    });
  });
});

db.close(() => console.log('Migration complete.'));