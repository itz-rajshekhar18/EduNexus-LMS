// server/server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { connectDB, setupShutdown } = require('./config/db');

// Routers
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const assignmentRoutes = require('./routes/assignments');

const app = express();

// Trust proxy (needed if behind reverse proxy/load balancer)
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// Security headers early
app.use(helmet());

// CORS
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, cb) {
      if (!origin) return cb(null, true); // allow non-browser clients
      if (!allowedOrigins.length || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Logging
const logFormat = process.env.MORGAN_FORMAT || 'combined';
app.use(morgan(logFormat));

// Body parsing
app.use(
  express.json({
    limit: process.env.JSON_LIMIT || '10mb',
    strict: true,
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: process.env.JSON_LIMIT || '10mb',
  })
);

// Cookies (for optional JWT cookie auth)
app.use(cookieParser(process.env.COOKIE_SECRET || undefined));

// Basic healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    env: process.env.NODE_ENV || 'development',
    time: new Date().toISOString(),
  });
});

// Global API rate limiter (tune per needs)
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_WINDOW_MS || `${15 * 60 * 1000}`, 10), // 15 min
  max: parseInt(process.env.RATE_MAX || '1000', 10), // 1000 requests/window per IP
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/assignments', assignmentRoutes);

// 404 handler
app.use((req, res, _next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Centralized error handler
// Recognizes typical errors from JSON parsing, CORS, multer, and generic
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  const status =
    err.status ||
    (err.type === 'entity.too.large' ? 413 :
     err.name === 'MulterError' ? 400 :
     err.message === 'Not allowed by CORS' ? 403 :
     500);

  const payload = {
    success: false,
    message:
      err.expose && err.message
        ? err.message
        : status === 500
        ? 'Internal Server Error'
        : err.message || 'Error',
  };

  if (process.env.NODE_ENV !== 'production') {
    payload.stack = err.stack;
  }

  res.status(status).json(payload);
});

// Connect DB then start server
const PORT = parseInt(process.env.PORT || '5000', 10);
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    setupShutdown();
  })
  .catch((err) => {
    console.error('Unable to start server without DB:', err);
    process.exit(1);
  });

module.exports = app;
