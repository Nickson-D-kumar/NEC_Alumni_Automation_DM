const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

const app = express();

// Enable CORS with Credentials & Specific Port Origins
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'],
  credentials: true
}));

// Express Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Route Files
const authRoutes = require('./routes/authRoutes');
const alumniRoutes = require('./routes/alumniRoutes');
const staffRoutes = require('./routes/staffRoutes');
const officerRoutes = require('./routes/officerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api', authRoutes);
app.use('/auth', authRoutes);
app.use('/api/alumni', alumniRoutes);
app.use('/api/student', alumniRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/officer', officerRoutes);
app.use('/api/back-officer', officerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', adminRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Institutional Alumni CRM & Multi-Tier Verification API',
    timestamp: new Date()
  });
});

// Serve frontend static build if available (Production setup)
const frontendDist = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));

app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api/')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('API Server active. Frontend app loading or dev server running separately.');
    }
  });
});

// Global Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Global Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : undefined
  });
});

const PORT = process.env.PORT || 5000;

const autoSeed = require('./utils/autoSeed');

// Connect DB, AutoSeed if empty, and Start Server
connectDB().then(async () => {
  await autoSeed();
  app.listen(PORT, () => {
    console.log(`===========================================================`);
    console.log(`🚀 Alumni CRM API Server running on port ${PORT}`);
    console.log(`👉 API Base: http://localhost:${PORT}/api`);
    console.log(`===========================================================`);
  });
});
