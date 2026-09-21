const db = require('../config/database');

class UserRepository {
  async findByEmail(email) {
    const query = `
      SELECT id, email, password_hash, role, created_at, updated_at
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1;
    `;
    const result = await db.query(query, [email]);
    return result.rows[0] || null;
  }

  async findById(id) {
    const query = `
      SELECT id, email, password_hash, role, created_at, updated_at
      FROM users
      WHERE id = $1
      LIMIT 1;
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  async create({ id, email, passwordHash, role = 'APPLICANT' }) {
    const query = `
      INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id, email, role, created_at, updated_at;
    `;
    const result = await db.query(query, [id, email.toLowerCase(), passwordHash, role]);
    return result.rows[0];
  }

  async deleteByEmail(email) {
    const query = `
      DELETE FROM users WHERE LOWER(email) = LOWER($1);
    `;
    await db.query(query, [email]);
  }
}

module.exports = new UserRepository();
