const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class ExplanationRepository {
  /**
   * Persist a generated explanation to the database
   */
  async create({ id, assessmentId, provider, model, promptVersion, summary, fullExplanation }) {
    const explanationId = id || `exp_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      const query = `
        INSERT INTO llm_explanations (
          id, assessment_id, provider, model, prompt_version, summary, full_explanation, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING id, assessment_id, provider, model, prompt_version, summary, full_explanation, created_at;
      `;

      const result = await client.query(query, [
        explanationId,
        assessmentId,
        provider,
        model,
        promptVersion,
        summary,
        JSON.stringify(fullExplanation),
      ]);

      // Update assessment explanation status to 'GENERATED'
      await client.query(
        `UPDATE risk_assessments SET explanation_status = 'GENERATED' WHERE id = $1`,
        [assessmentId]
      );

      await client.query('COMMIT');

      const row = result.rows[0];
      return {
        id: row.id,
        assessmentId: row.assessment_id,
        provider: row.provider,
        model: row.model,
        promptVersion: row.prompt_version,
        summary: row.summary,
        fullExplanation: typeof row.full_explanation === 'string' ? JSON.parse(row.full_explanation) : row.full_explanation,
        createdAt: row.created_at,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Find latest explanation for an assessment
   */
  async findByAssessmentId(assessmentId) {
    const query = `
      SELECT id, assessment_id, provider, model, prompt_version, summary, full_explanation, created_at
      FROM llm_explanations
      WHERE assessment_id = $1
      ORDER BY created_at DESC
      LIMIT 1;
    `;

    const result = await db.query(query, [assessmentId]);
    if (!result.rows || result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      assessmentId: row.assessment_id,
      provider: row.provider,
      model: row.model,
      promptVersion: row.prompt_version,
      summary: row.summary,
      fullExplanation: typeof row.full_explanation === 'string' ? JSON.parse(row.full_explanation) : row.full_explanation,
      createdAt: row.created_at,
    };
  }

  /**
   * Find latest explanation for an application
   */
  async findLatestByApplicationId(applicationId) {
    const query = `
      SELECT e.id, e.assessment_id, e.provider, e.model, e.prompt_version, e.summary, e.full_explanation, e.created_at
      FROM llm_explanations e
      JOIN risk_assessments a ON e.assessment_id = a.id
      WHERE a.application_id = $1
      ORDER BY e.created_at DESC
      LIMIT 1;
    `;

    const result = await db.query(query, [applicationId]);
    if (!result.rows || result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      assessmentId: row.assessment_id,
      provider: row.provider,
      model: row.model,
      promptVersion: row.prompt_version,
      summary: row.summary,
      fullExplanation: typeof row.full_explanation === 'string' ? JSON.parse(row.full_explanation) : row.full_explanation,
      createdAt: row.created_at,
    };
  }
}

module.exports = new ExplanationRepository();
