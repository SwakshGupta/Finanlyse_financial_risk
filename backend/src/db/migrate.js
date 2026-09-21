const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  console.log('[Migration] Checking migrations directory:', migrationsDir);

  if (!fs.existsSync(migrationsDir)) {
    console.log('[Migration] No migrations directory found.');
    return;
  }

  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Ensure schema_migrations exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Get applied migrations
    const { rows: appliedRows } = await client.query('SELECT version FROM schema_migrations');
    const appliedVersions = new Set(appliedRows.map(r => r.version));

    // Read migration files in alphabetical/numerical order
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    let executedCount = 0;

    for (const file of files) {
      if (!appliedVersions.has(file)) {
        console.log(`[Migration] Applying ${file}...`);
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');

        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (version, applied_at) VALUES ($1, NOW())',
          [file]
        );
        console.log(`[Migration] Applied ${file} successfully.`);
        executedCount++;
      } else {
        console.log(`[Migration] Skipping already applied ${file}.`);
      }
    }

    await client.query('COMMIT');
    console.log(`[Migration] Completed. ${executedCount} new migration(s) executed.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Migration Error]:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { runMigrations };
