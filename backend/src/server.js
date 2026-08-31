const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
  const now = new Date().toISOString().split('T')[1].slice(0, 8);
  console.log(`[${now}] [Tier 2 App] ${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use('/api', apiRoutes);

// Optional: Serve frontend static files if running together locally
const frontendPath = path.join(__dirname, '../../frontend');
app.use(express.static(frontendPath));

// Fallback for SPA routing if serving frontend
app.get('*', (req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log('====================================================');
  console.log(`🚀 [Tier 2 - Application Layer] Server Running`);
  console.log(`📡 Listening on: http://0.0.0.0:${PORT}`);
  console.log(`📊 Health Endpoint: http://localhost:${PORT}/api/health`);
  console.log(`🏗️ Tier Status:    http://localhost:${PORT}/api/system/tier-status`);
  console.log(`🗄️ Database Tier:  ${process.env.DB_HOST ? `AWS RDS at ${process.env.DB_HOST}` : 'Local Memory Mode'}`);
  console.log('====================================================');
});
