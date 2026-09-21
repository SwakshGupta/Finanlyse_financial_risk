const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class AssessmentRepository {
  /**
   * Save a complete risk assessment along with its risk factors in a transaction
   */
  async saveAssessment({
    assessmentId,
    applicationId,
    score,
    defaultProbability,
    riskBand,
    modelMetadata,
    factors = { positive: [], negative: [] },
    dataCoverage,
    explanationStatus = 'NOT_GENERATED',
    assessmentType = 'BASELINE',
  }) {
    const id = assessmentId || `asm_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      const insertAssessmentSql = `
        INSERT INTO risk_assessments (
          id, application_id, score, default_probability, risk_band,
          model_version, model_name, feature_set_version, algorithm,
          raw_factors, data_coverage, explanation_status, assessment_type,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
        RETURNING *;
      `;

      const assessmentResult = await client.query(insertAssessmentSql, [
        id,
        applicationId,
        score,
        defaultProbability,
        riskBand,
        modelMetadata?.version || 'logistic_regression_v1.0.0',
        modelMetadata?.name || 'Logistic Regression Alternative Risk Baseline',
        modelMetadata?.featureSetVersion || 'feature_set_v1',
        modelMetadata?.algorithm || 'LOGISTIC_REGRESSION',
        JSON.stringify(factors),
        JSON.stringify(dataCoverage),
        explanationStatus,
        assessmentType,
      ]);

      const savedAssessment = assessmentResult.rows[0];

      // Insert individual risk factor records
      const allFactors = [
        ...(factors.positive || []).map(f => ({ ...f, impact: 'POSITIVE' })),
        ...(factors.negative || []).map(f => ({ ...f, impact: 'NEGATIVE' })),
      ];

      for (const factor of allFactors) {
        const factorId = `rf_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
        const insertFactorSql = `
          INSERT INTO risk_factors (
            id, assessment_id, feature_name, impact, contribution, description
          )
          VALUES ($1, $2, $3, $4, $5, $6);
        `;

        await client.query(insertFactorSql, [
          factorId,
          id,
          factor.feature,
          factor.impact,
          factor.contribution || 0.0,
          factor.impactDescription || factor.impact || factor.feature,
        ]);
      }

      await client.query('COMMIT');
      return {
        ...savedAssessment,
        factors,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Retrieve the latest risk assessment for an application.
   * Defaults to fetching the authoritative BASELINE assessment so that
   * counterfactual SCENARIO simulations do not overwrite or shadow the baseline score.
   */
  async getLatestByApplicationId(applicationId, assessmentType = 'BASELINE') {
    let query;
    let params;

    if (assessmentType) {
      query = `
        SELECT * FROM risk_assessments
        WHERE application_id = $1 AND (assessment_type = $2 OR assessment_type IS NULL)
        ORDER BY created_at DESC
        LIMIT 1;
      `;
      params = [applicationId, assessmentType];
    } else {
      query = `
        SELECT * FROM risk_assessments
        WHERE application_id = $1
        ORDER BY created_at DESC
        LIMIT 1;
      `;
      params = [applicationId];
    }

    const result = await db.query(query, params);
    if (!result.rows || result.rows.length === 0) {
      return null;
    }

    const assessment = result.rows[0];
    const factors = await this.getFactorsByAssessmentId(assessment.id);

    return {
      ...assessment,
      factors,
    };
  }

  /**
   * Retrieve risk factors for an assessment
   */
  async getFactorsByAssessmentId(assessmentId) {
    const query = `
      SELECT * FROM risk_factors
      WHERE assessment_id = $1;
    `;
    const result = await db.query(query, [assessmentId]);
    const positive = [];
    const negative = [];

    for (const row of result.rows || []) {
      const factorObj = {
        feature: row.feature_name,
        value: row.value || null,
        contribution: parseFloat(row.contribution),
        direction: row.impact,
        explanationKey: row.feature_name,
      };
      if (row.impact === 'POSITIVE') {
        positive.push(factorObj);
      } else {
        negative.push(factorObj);
      }
    }

    return { positive, negative };
  }

  /**
   * Retrieve risk assessment by its ID
   */
  async getById(id) {
    const query = `
      SELECT * FROM risk_assessments
      WHERE id = $1
      LIMIT 1;
    `;
    const result = await db.query(query, [id]);
    if (!result.rows || result.rows.length === 0) {
      return null;
    }

    const assessment = result.rows[0];
    const factors = await this.getFactorsByAssessmentId(assessment.id);

    return {
      ...assessment,
      factors,
    };
  }
}

module.exports = new AssessmentRepository();
