const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { getDBStatus } = require('./config/db');
const ApiError = require('./utils/apiError');
const errorHandler = require('./middlewares/error.middleware');

// Library Management System Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const bookRoutes = require('./routes/book.routes');
const copyRoutes = require('./routes/copy.routes');
const loanRoutes = require('./routes/loan.routes');
const reservationRoutes = require('./routes/reservation.routes');
const fineRoutes = require('./routes/fine.routes');
const libraryReportRoutes = require('./routes/libraryReport.routes');
const notificationRoutes = require('./routes/notification.routes');
const auditRoutes = require('./routes/audit.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// Security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === allowedOrigin || origin === 'http://localhost:5173' || origin === 'http://127.0.0.1:5173') {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  }
});
app.use('/api', apiLimiter);

// Auth rate limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes'
  }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body Parsers with limits
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Static uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbConnected = getDBStatus();
  const healthData = {
    status: dbConnected ? 'healthy' : 'degraded',
    service: 'LibraryVerse LMS API',
    database: {
      connected: dbConnected,
      type: 'MongoDB'
    },
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  };

  const statusCode = dbConnected ? 200 : (process.env.NODE_ENV === 'production' ? 503 : 200);
  res.status(statusCode).json(healthData);
});

// Library Management System API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/copies', copyRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/fines', fineRoutes);
app.use('/api/library-reports', libraryReportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/admin', adminRoutes);

// 404 Route Handler for undefined endpoints
app.use('*', (req, res, next) => {
  next(new ApiError(404, `API route not found: ${req.method} ${req.originalUrl}`));
});

// Global Centralized Error Handler
app.use(errorHandler);

module.exports = app;
