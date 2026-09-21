const db = require('../config/database');

class HealthController {
  getHealth(req, res) {
    return res.status(200).json({
      status: 'UP',
      service: 'risk-assessment-api',
      timestamp: new Date().toISOString()
    });
  }

  async getReadiness(req, res) {
    const isDbAlive = await db.checkConnection();

    const checks = {
      database: isDbAlive ? 'UP' : 'DOWN'
    };

    const isReady = isDbAlive;
    const statusCode = isReady ? 200 : 503;

    return res.status(statusCode).json({
      status: isReady ? 'READY' : 'NOT_READY',
      checks,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = new HealthController();
