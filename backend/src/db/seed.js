const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

async function seedDatabase() {
  console.log('[Seed] Seeding demo accounts and initial data...');
  const passwordHash = await bcrypt.hash('password12345', 10);

  // 1. Seed Demo Applicant
  const applicantEmail = 'borrower.demo@example.com';
  const applicantId = 'usr_applicant_demo_001';
  await db.query(`
    INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
    VALUES ($1, $2, $3, 'APPLICANT', NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;
  `, [applicantId, applicantEmail, passwordHash]);

  // 2. Seed Demo Analyst
  const analystEmail = 'credit.analyst@example.com';
  const analystId = 'usr_analyst_demo_001';
  await db.query(`
    INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
    VALUES ($1, $2, $3, 'ANALYST', NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;
  `, [analystId, analystEmail, passwordHash]);

  // 3. Seed an initial sample application for the demo applicant
  const appId = 'app_demo_seeded_0001';
  await db.query(`
    INSERT INTO applications (id, user_id, status, created_at, updated_at)
    VALUES ($1, $2, 'ASSESSED', NOW() - INTERVAL '1 hour', NOW())
    ON CONFLICT (id) DO NOTHING;
  `, [appId, applicantId]);

  await db.query(`
    INSERT INTO applicant_profiles (id, application_id, full_name, phone, employment_type, created_at)
    VALUES ($1, $2, 'Arjun Verma', '+919876543210', 'GIG_WORKER', NOW() - INTERVAL '1 hour')
    ON CONFLICT DO NOTHING;
  `, [`prof_${uuidv4().slice(0, 16)}`, appId]);

  await db.query(`
    INSERT INTO data_sources (id, application_id, source_type, status, created_at)
    VALUES ($1, $2, 'SYNTHETIC_DATA', 'CONNECTED', NOW() - INTERVAL '1 hour')
    ON CONFLICT DO NOTHING;
  `, [`ds_${uuidv4().slice(0, 16)}`, appId]);

  // 4. Seed financial profile
  await db.query(`
    INSERT INTO financial_profiles (
      id, application_id, monthly_income, monthly_expenses, average_balance,
      savings_balance, existing_emi, currency, created_at, updated_at
    )
    VALUES ($1, $2, 42000, 22000, 14000, 20000, 3500, 'INR', NOW() - INTERVAL '1 hour', NOW())
    ON CONFLICT (application_id) DO NOTHING;
  `, [`fin_${uuidv4().slice(0, 16)}`, appId]);

  // 5. Seed initial risk assessment
  const assessmentId = 'asm_demo_seeded_0001';
  const sampleFactors = {
    positive: [
      { feature: 'cashFlowSurplus', value: 16500, contribution: 0.45, direction: 'POSITIVE', impact: 'Robust net positive monthly cash flow' },
      { feature: 'incomeStability', value: 0.88, contribution: 0.38, direction: 'POSITIVE', impact: 'High weekly earnings regularity across platforms' }
    ],
    negative: [
      { feature: 'debtToIncome', value: 0.08, contribution: 0.22, direction: 'NEGATIVE', impact: 'Low existing debt burden relative to income' }
    ]
  };

  const sampleCoverage = {
    financialDataAvailable: true,
    bureauDataAvailable: false,
    observationMonths: 6,
    dataSources: ['SYNTHETIC_DATA']
  };

  await db.query(`
    INSERT INTO risk_assessments (
      id, application_id, score, default_probability, risk_band,
      model_version, model_name, feature_set_version, algorithm,
      raw_factors, data_coverage, explanation_status, assessment_type, created_at
    )
    VALUES ($1, $2, 82, 0.0680, 'LOW', 'logistic_regression_v1.0.0',
      'Logistic Regression Alternative Risk Baseline', 'feature_set_v1', 'LOGISTIC_REGRESSION',
      $3, $4, 'NOT_GENERATED', 'BASELINE', NOW() - INTERVAL '1 hour')
    ON CONFLICT (id) DO NOTHING;
  `, [assessmentId, appId, JSON.stringify(sampleFactors), JSON.stringify(sampleCoverage)]);

  for (const factor of sampleFactors.positive) {
    await db.query(`
      INSERT INTO risk_factors (id, assessment_id, feature_name, impact, contribution, description)
      VALUES ($1, $2, $3, 'POSITIVE', $4, $5)
      ON CONFLICT DO NOTHING;
    `, [`rf_${uuidv4().slice(0, 16)}`, assessmentId, factor.feature, factor.contribution, factor.impact]);
  }

  for (const factor of sampleFactors.negative) {
    await db.query(`
      INSERT INTO risk_factors (id, assessment_id, feature_name, impact, contribution, description)
      VALUES ($1, $2, $3, 'NEGATIVE', $4, $5)
      ON CONFLICT DO NOTHING;
    `, [`rf_${uuidv4().slice(0, 16)}`, assessmentId, factor.feature, factor.contribution, factor.impact]);
  }

  console.log('[Seed] Seeding completed successfully!');
  console.log('[Seed] Demo accounts ready:');
  console.log('       Applicant: borrower.demo@example.com / password12345');
  console.log('       Analyst:   credit.analyst@example.com / password12345');
}

if (require.main === module) {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Error]:', err);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
