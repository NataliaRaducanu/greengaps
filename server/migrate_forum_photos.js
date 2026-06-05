const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'greengaps.db');
const db = new sqlite3.Database(dbPath);

const migrations = [
  `ALTER TABLE forum_posts ADD COLUMN images TEXT DEFAULT NULL`,
  `ALTER TABLE forum_replies ADD COLUMN images TEXT DEFAULT NULL`,
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