// In-memory test database mock for unit/integration tests without requiring an external DB
const usersStore = new Map();
const applicationsStore = new Map();
const applicantProfilesStore = new Map();
const consentsStore = new Map();
const dataSourcesStore = new Map();
const financialProfilesStore = new Map();
const transactionsStore = new Map();
const assessmentsStore = new Map();
const riskFactorsStore = new Map();

async function handleQuery(text, params = []) {
  const trimmed = text.trim();

  // Transaction controls
  if (trimmed === 'BEGIN' || trimmed === 'COMMIT' || trimmed === 'ROLLBACK') {
    return { rows: [] };
  }

  // Health check query
  if (trimmed.includes('SELECT 1 AS alive')) {
    return { rows: [{ alive: 1 }] };
  }

  // ---------------------------------------------------------------------------
  // USERS
  // ---------------------------------------------------------------------------
  if (trimmed.includes('FROM users') && trimmed.includes('WHERE LOWER(email) = LOWER($1)')) {
    const email = params[0].toLowerCase();
    const user = usersStore.get(email);
    return { rows: user ? [user] : [] };
  }

  if (trimmed.includes('FROM users') && trimmed.includes('WHERE id = $1')) {
    const id = params[0];
    for (const u of usersStore.values()) {
      if (u.id === id) return { rows: [u] };
    }
    return { rows: [] };
  }

  if (trimmed.startsWith('INSERT INTO users')) {
    const [id, email, password_hash, role] = params;
    const now = new Date().toISOString();
    const newUser = {
      id,
      email: email.toLowerCase(),
      password_hash,
      role: role || 'APPLICANT',
      created_at: now,
      updated_at: now
    };
    usersStore.set(email.toLowerCase(), newUser);
    return { rows: [newUser] };
  }

  if (trimmed.startsWith('DELETE FROM users')) {
    const email = params[0].toLowerCase();
    usersStore.delete(email);
    return { rows: [] };
  }

  // ---------------------------------------------------------------------------
  // APPLICATIONS
  // ---------------------------------------------------------------------------
  if (trimmed.startsWith('INSERT INTO applications')) {
    const [id, user_id, status] = params;
    const now = new Date().toISOString();
    const app = {
      id,
      user_id,
      status: status || 'DRAFT',
      created_at: now,
      updated_at: now
    };
    applicationsStore.set(id, app);
    return { rows: [app] };
  }

  if (trimmed.startsWith('INSERT INTO applicant_profiles')) {
    const [id, application_id, full_name, phone, employment_type] = params;
    const prof = {
      id,
      application_id,
      full_name,
      phone,
      employment_type,
      created_at: new Date().toISOString()
    };
    applicantProfilesStore.set(application_id, prof);
    return { rows: [prof] };
  }

  if (trimmed.startsWith('INSERT INTO consents')) {
    const [id, application_id, purpose, granted, version] = params;
    const consent = { id, application_id, purpose, granted, version };
    consentsStore.set(id, consent);
    return { rows: [consent] };
  }

  if (trimmed.startsWith('INSERT INTO data_sources')) {
    const [id, application_id, source_type] = params;
    const sources = dataSourcesStore.get(application_id) || [];
    sources.push(source_type);
    dataSourcesStore.set(application_id, sources);
    return { rows: [{ id, application_id, source_type }] };
  }

  if (trimmed.includes('FROM data_sources WHERE application_id = $1')) {
    const appId = params[0];
    const sources = dataSourcesStore.get(appId) || [];
    return { rows: sources.map(s => ({ source_type: s })) };
  }

  if (trimmed.includes('FROM applications a') && trimmed.includes('WHERE a.id = $1')) {
    const appId = params[0];
    const app = applicationsStore.get(appId);
    if (!app) return { rows: [] };
    const prof = applicantProfilesStore.get(appId) || {};
    return {
      rows: [{
        id: app.id,
        user_id: app.user_id,
        status: app.status,
        created_at: app.created_at,
        updated_at: app.updated_at,
        full_name: prof.full_name,
        phone: prof.phone,
        employment_type: prof.employment_type
      }]
    };
  }

  if (trimmed.startsWith('UPDATE applications')) {
    const now = new Date().toISOString();
    if (trimmed.includes('SET status = $1')) {
      const [status, id] = params;
      const app = applicationsStore.get(id);
      if (app) {
        app.status = status;
        app.updated_at = now;
      }
    } else {
      const [id] = params;
      const app = applicationsStore.get(id);
      if (app) app.updated_at = now;
    }
    return { rows: [] };
  }

  if (trimmed.startsWith('UPDATE applicant_profiles')) {
    const [full_name, phone, employment_type, appId] = params;
    const prof = applicantProfilesStore.get(appId);
    if (prof) {
      if (full_name) prof.full_name = full_name;
      if (phone) prof.phone = phone;
      if (employment_type) prof.employment_type = employment_type;
    }
    return { rows: [] };
  }

  if (trimmed.includes('FROM applications a') && trimmed.includes('WHERE a.user_id = $1')) {
    const userId = params[0];
    const apps = Array.from(applicationsStore.values()).filter(a => a.user_id === userId);
    return {
      rows: apps.map(app => {
        const prof = applicantProfilesStore.get(app.id) || {};
        return {
          id: app.id,
          user_id: app.user_id,
          status: app.status,
          created_at: app.created_at,
          updated_at: app.updated_at,
          full_name: prof.full_name,
          phone: prof.phone,
          employment_type: prof.employment_type
        };
      })
    };
  }

  if (trimmed.includes('FROM applications a') && !trimmed.includes('WHERE a.id = $1') && !trimmed.includes('WHERE a.user_id = $1')) {
    const apps = Array.from(applicationsStore.values());
    return {
      rows: apps.map(app => {
        const prof = applicantProfilesStore.get(app.id) || {};
        return {
          id: app.id,
          user_id: app.user_id,
          status: app.status,
          created_at: app.created_at,
          updated_at: app.updated_at,
          full_name: prof.full_name,
          phone: prof.phone,
          employment_type: prof.employment_type
        };
      })
    };
  }

  if (trimmed.includes('FROM applications') && trimmed.includes('WHERE user_id = $1')) {
    const userId = params[0];
    const apps = Array.from(applicationsStore.values()).filter(a => a.user_id === userId);
    return { rows: apps };
  }

  // ---------------------------------------------------------------------------
  // FINANCIAL PROFILES
  // ---------------------------------------------------------------------------
  if (trimmed.startsWith('INSERT INTO financial_profiles')) {
    const [id, application_id, monthly_income, monthly_expenses, average_balance, savings_balance, existing_emi, currency] = params;
    const now = new Date().toISOString();
    const prof = {
      id,
      application_id,
      monthly_income,
      monthly_expenses,
      average_balance,
      savings_balance,
      existing_emi,
      currency,
      created_at: now,
      updated_at: now
    };
    financialProfilesStore.set(application_id, prof);
    return { rows: [prof] };
  }

  if (trimmed.includes('FROM financial_profiles') && trimmed.includes('WHERE application_id = $1')) {
    const appId = params[0];
    const prof = financialProfilesStore.get(appId);
    return { rows: prof ? [prof] : [] };
  }

  // ---------------------------------------------------------------------------
  // TRANSACTIONS
  // ---------------------------------------------------------------------------
  if (trimmed.startsWith('INSERT INTO transactions')) {
    const [id, application_id, date, amount, type, category, description, balance_after] = params;
    const tx = {
      id,
      application_id,
      date,
      amount,
      type,
      category,
      description,
      balance_after,
      created_at: new Date().toISOString()
    };
    const txList = transactionsStore.get(application_id) || [];
    txList.push(tx);
    transactionsStore.set(application_id, txList);
    return { rows: [tx] };
  }

  if (trimmed.includes('FROM transactions') && trimmed.includes('WHERE application_id = $1')) {
    const appId = params[0];
    const txList = transactionsStore.get(appId) || [];
    return { rows: [...txList] };
  }

  // ---------------------------------------------------------------------------
  // RISK ASSESSMENTS & RISK FACTORS
  // ---------------------------------------------------------------------------
  if (trimmed.startsWith('INSERT INTO risk_assessments')) {
    const [
      id, application_id, score, default_probability, risk_band,
      model_version, model_name, feature_set_version, algorithm,
      raw_factors, data_coverage, explanation_status, assessment_type
    ] = params;
    const now = new Date().toISOString();
    const assessment = {
      id,
      application_id,
      score,
      default_probability,
      risk_band,
      model_version,
      model_name,
      feature_set_version,
      algorithm,
      raw_factors,
      data_coverage,
      explanation_status,
      assessment_type,
      created_at: now
    };
    assessmentsStore.set(id, assessment);
    return { rows: [assessment] };
  }

  if (trimmed.startsWith('INSERT INTO risk_factors')) {
    const [id, assessment_id, feature_name, impact, contribution, description] = params;
    const factor = {
      id,
      assessment_id,
      feature_name,
      impact,
      contribution,
      description
    };
    const factors = riskFactorsStore.get(assessment_id) || [];
    factors.push(factor);
    riskFactorsStore.set(assessment_id, factors);
    return { rows: [factor] };
  }

  if (trimmed.includes('FROM risk_assessments') && trimmed.includes('WHERE application_id = $1')) {
    const appId = params[0];
    const matching = Array.from(assessmentsStore.values())
      .filter(a => a.application_id === appId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { rows: matching.slice(0, 1) };
  }

  if (trimmed.includes('FROM risk_assessments') && trimmed.includes('WHERE id = $1')) {
    const id = params[0];
    const assessment = assessmentsStore.get(id);
    return { rows: assessment ? [assessment] : [] };
  }

  if (trimmed.includes('FROM risk_factors') && trimmed.includes('WHERE assessment_id = $1')) {
    const assessmentId = params[0];
    const factors = riskFactorsStore.get(assessmentId) || [];
    return { rows: factors };
  }

  // ---------------------------------------------------------------------------
  // LLM EXPLANATIONS
  // ---------------------------------------------------------------------------
  if (trimmed.startsWith('INSERT INTO llm_explanations')) {
    const [id, assessment_id, provider, model, prompt_version, summary, full_explanation] = params;
    const now = new Date().toISOString();
    const explanation = {
      id,
      assessment_id,
      provider,
      model,
      prompt_version,
      summary,
      full_explanation,
      created_at: now
    };
    explanationsStore.set(id, explanation);
    return { rows: [explanation] };
  }

  if (trimmed.includes('UPDATE risk_assessments SET explanation_status')) {
    const assessmentId = params[0];
    const assessment = assessmentsStore.get(assessmentId);
    if (assessment) {
      assessment.explanation_status = 'GENERATED';
    }
    return { rows: [] };
  }

  if (trimmed.includes('FROM llm_explanations') && trimmed.includes('WHERE assessment_id = $1')) {
    const assessmentId = params[0];
    const matching = Array.from(explanationsStore.values())
      .filter(e => e.assessment_id === assessmentId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { rows: matching.slice(0, 1) };
  }

  if (trimmed.includes('FROM llm_explanations e') && trimmed.includes('WHERE a.application_id = $1')) {
    const appId = params[0];
    // Find assessments for this app
    const appAssessments = Array.from(assessmentsStore.values())
      .filter(a => a.application_id === appId)
      .map(a => a.id);

    const matching = Array.from(explanationsStore.values())
      .filter(e => appAssessments.includes(e.assessment_id))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { rows: matching.slice(0, 1) };
  }

  return { rows: [] };
}

const explanationsStore = new Map();

const mockPool = {
  async query(text, params = []) {
    return handleQuery(text, params);
  },

  async connect() {
    return {
      query: (text, params) => handleQuery(text, params),
      release: () => {}
    };
  },

  async getClient() {
    return this.connect();
  },

  reset() {
    usersStore.clear();
    applicationsStore.clear();
    applicantProfilesStore.clear();
    consentsStore.clear();
    dataSourcesStore.clear();
    financialProfilesStore.clear();
    transactionsStore.clear();
    assessmentsStore.clear();
    riskFactorsStore.clear();
    explanationsStore.clear();
  },

  async end() {}
};

module.exports = mockPool;

