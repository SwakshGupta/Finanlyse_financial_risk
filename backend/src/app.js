const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Security & utility middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());

// Base health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'risk-assessment-api',
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
