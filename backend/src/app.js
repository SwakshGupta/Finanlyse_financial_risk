const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const requestIdMiddleware = require('./middleware/requestId');
const errorHandler = require('./middleware/errorHandler');
const { NotFoundError } = require('./utils/errors');

const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const applicationRoutes = require('./routes/application.routes');

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id']
}));

// Request body parser
app.use(express.json({ limit: '10mb' }));

// Request ID propagation
app.use(requestIdMiddleware);

// HTTP Logging (disabled in unit test runner)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms [req: :req[x-request-id]]'));
}

// Health and readiness endpoints (root namespace)
app.use('/', healthRoutes);

// Public API v1 endpoints
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/applications', applicationRoutes);

// 404 handler for undefined routes
app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
