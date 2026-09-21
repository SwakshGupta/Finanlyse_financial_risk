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
    try {
      if (process.env.USE_MOCK_DB !== 'true') {
        await runMigrations();
        await seedDatabase();
      }
    } catch (err) {
      console.warn('[Startup DB Notice]:', err.message);
    }

    app.listen(PORT, () => {
      console.log(`[Backend] Risk Assessment API listening on port ${PORT}`);
    });
  })();
}

module.exports = app;
