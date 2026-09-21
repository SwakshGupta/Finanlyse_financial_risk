const { Pool } = require('pg');

let pool = null;

function getPoolConfig() {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    };
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'finalyse_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  };
}

function getPool() {
  if (!pool) {
    pool = new Pool(getPoolConfig());
    pool.on('error', (err) => {
      console.error('[Database Pool Error]:', err.message);
    });
  }
  return pool;
}

// Allows injecting a mock pool for unit tests
function setPool(customPool) {
  pool = customPool;
}

async function query(text, params) {
  const activePool = getPool();
  return activePool.query(text, params);
}

async function getClient() {
  const activePool = getPool();
  return activePool.connect();
}

async function checkConnection() {
  try {
    const activePool = getPool();
    const result = await activePool.query('SELECT 1 AS alive');
    return result.rows && result.rows.length > 0;
  } catch (err) {
    return false;
  }
}

async function close() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  getPool,
  setPool,
  query,
  getClient,
  checkConnection,
  close
};
