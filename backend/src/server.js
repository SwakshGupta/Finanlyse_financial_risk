const path = require('path');
// Load environment variables from root or current directory
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const { runMigrations } = require('./db/migrate');
const { seedDatabase } = require('./db/seed');

const PORT = process.env.PORT || 4000;

if (require.main === module) {
  (async () => {
    // Database connection retry for containerized / cloud startup resilience
    if (process.env.USE_MOCK_DB !== 'true') {
      const maxRetries = 5;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await runMigrations();
          await seedDatabase();
          break;
        } catch (err) {
          console.warn(`[Startup DB Attempt ${attempt}/${maxRetries}]: ${err.message}`);
          if (attempt === maxRetries) {
            console.warn('[Startup DB Notice]: Could not complete initial migrations/seeding. Server will continue and serve requests.');
          } else {
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }
      }
    }

    const server = app.listen(PORT, () => {
      console.log(`[Backend] Risk Assessment API listening on port ${PORT}`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal) => {
      console.log(`[Backend] Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        try {
          const db = require('./config/database');
          await db.close();
          console.log('[Backend] Database pool closed. Process terminated cleanly.');
          process.exit(0);
        } catch (err) {
          console.error('[Backend] Error during shutdown:', err.message);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  })();
}

module.exports = app;
