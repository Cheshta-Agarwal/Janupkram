require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { uploadsDir } = require('./config/cloudinary');
const errorHandler = require('./middleware/errorHandler');
const { ensureSeeded } = require('./seed/seedData');

const authRoutes = require('./routes/auth');
const challengeRoutes = require('./routes/challenges');
const proposalRoutes = require('./routes/proposals');
const partnershipRoutes = require('./routes/partnerships');
const analyticsRoutes = require('./routes/analytics');
const notificationRoutes = require('./routes/notifications');

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : '*',
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Janupkram — SIH26043 Societal Innovation Collaboration Portal API',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/partnerships', partnershipRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  connectDB()
    .then(() => ensureSeeded())
    .then(() => {
      app.listen(PORT, () => {
        console.log(`SIH26043 Portal Server running on http://localhost:${PORT}`);
      });
    });
}

module.exports = app;
