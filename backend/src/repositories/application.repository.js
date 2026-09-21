const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class ApplicationRepository {
  async create({ id, userId, status = 'DRAFT', applicant, consents = [], dataSources = ['MANUAL_INPUT'] }) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // 1. Insert application
      const appQuery = `
        INSERT INTO applications (id, user_id, status, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING id, user_id, status, created_at, updated_at;
      `;
      const appResult = await client.query(appQuery, [id, userId, status]);
      const appRecord = appResult.rows[0];

      // 2. Insert applicant profile
      const profId = `prof_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
      const profQuery = `
        INSERT INTO applicant_profiles (
          id, application_id, full_name, phone, employment_type, created_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING id, full_name, phone, employment_type;
      `;
      const profResult = await client.query(profQuery, [
        profId,
        id,
        applicant.fullName,
        applicant.phone || null,
        applicant.employmentType || null
      ]);

      // 3. Insert consents
      for (const consent of consents) {
        const consentId = `cst_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
        await client.query(
          `INSERT INTO consents (id, application_id, purpose, granted, version, granted_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            consentId,
            id,
            consent.purpose || 'UNDERWRITING',
            consent.granted !== undefined ? consent.granted : true,
            consent.version || '1.0'
          ]
        );
      }

      // 4. Insert data sources
      for (const source of dataSources) {
        const dsId = `ds_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
        await client.query(
          `INSERT INTO data_sources (id, application_id, source_type, status, created_at)
           VALUES ($1, $2, $3, 'CONNECTED', NOW())`,
          [dsId, id, source]
        );
      }

      await client.query('COMMIT');

      return {
        id: appRecord.id,
        userId: appRecord.user_id,
        status: appRecord.status,
        applicant: {
          fullName: profResult.rows[0].full_name,
          phone: profResult.rows[0].phone,
          employmentType: profResult.rows[0].employment_type
        },
        dataSources,
        createdAt: appRecord.created_at,
        updatedAt: appRecord.updated_at
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async findById(id) {
    const appQuery = `
      SELECT a.id, a.user_id, a.status, a.created_at, a.updated_at,
             p.full_name, p.phone, p.employment_type
      FROM applications a
      LEFT JOIN applicant_profiles p ON a.id = p.application_id
      WHERE a.id = $1
      LIMIT 1;
    `;
    const result = await db.query(appQuery, [id]);
    if (!result.rows || result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    // Fetch data sources
    const dsResult = await db.query(
      'SELECT source_type FROM data_sources WHERE application_id = $1',
      [id]
    );
    const dataSources = dsResult.rows.map(r => r.source_type);

    return {
      id: row.id,
      userId: row.user_id,
      status: row.status,
      applicant: {
        fullName: row.full_name,
        phone: row.phone,
        employmentType: row.employment_type
      },
      dataSources: dataSources.length > 0 ? dataSources : ['MANUAL_INPUT'],
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async update(id, { status, applicant }) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      if (status) {
        await client.query(
          `UPDATE applications SET status = $1, updated_at = NOW() WHERE id = $2`,
          [status, id]
        );
      } else {
        await client.query(
          `UPDATE applications SET updated_at = NOW() WHERE id = $1`,
          [id]
        );
      }

      if (applicant) {
        await client.query(
          `UPDATE applicant_profiles
           SET full_name = COALESCE($1, full_name),
               phone = COALESCE($2, phone),
               employment_type = COALESCE($3, employment_type)
           WHERE application_id = $4`,
          [applicant.fullName, applicant.phone, applicant.employmentType, id]
        );
      }

      await client.query('COMMIT');
      return this.findById(id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async findByUserId(userId) {
    const query = `
      SELECT a.id, a.user_id, a.status, a.created_at, a.updated_at,
             p.full_name, p.phone, p.employment_type
      FROM applications a
      LEFT JOIN applicant_profiles p ON a.id = p.application_id
      WHERE a.user_id = $1
      ORDER BY a.created_at DESC;
    `;
    const result = await db.query(query, [userId]);
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      status: row.status,
      applicant: {
        fullName: row.full_name,
        phone: row.phone,
        employmentType: row.employment_type
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  async findAll(limit = 50) {
    const query = `
      SELECT a.id, a.user_id, a.status, a.created_at, a.updated_at,
             p.full_name, p.phone, p.employment_type
      FROM applications a
      LEFT JOIN applicant_profiles p ON a.id = p.application_id
      ORDER BY a.created_at DESC
      LIMIT $1;
    `;
    const result = await db.query(query, [limit]);
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      status: row.status,
      applicant: {
        fullName: row.full_name,
        phone: row.phone,
        employmentType: row.employment_type
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }
}

module.exports = new ApplicationRepository();
