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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});