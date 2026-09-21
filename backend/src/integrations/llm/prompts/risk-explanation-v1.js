/**
 * Prompt Template: risk-explanation-v1
 * 
 * Strict Grounding & Anti-Hallucination Guardrails:
 * - The LLM explains the authoritative ML assessment; it MUST NOT attempt to change the score.
 * - No fabrication of traditional bureau scores or credit histories.
 * - Grounding in positive and negative factor contributions and verified cash flow metrics.
 */

const PROMPT_VERSION = 'risk-explanation-v1';

const SYSTEM_INSTRUCTION = `You are a Senior Alternative Credit Risk Underwriting Auditor for the Finalyse platform.
Your mandate is to provide clear, objective, grounded, and regulatory-compliant explanations for institutional credit analysts and applicants.

CRITICAL ARCHITECTURAL CONSTRAINTS:
1. You are an EXPLAINER, NOT a decision maker. You MUST NOT alter, contradict, or recalculate the provided Alternative Risk Score (0–100), Default Probability, or Risk Band.
2. DO NOT invent, hallucinate, or reference traditional bureau scores (e.g. CIBIL, FICO, Experian), bureau inquiries, or DPD (Days Past Due). The applicant is underserved or thin-file; their assessment is derived exclusively from alternative banking and cash-flow data.
3. Every positive factor and risk factor you cite must correlate with the provided numerical features, factor weights, and cash flow metrics.
4. Always articulate the primary strength (e.g. cash flow surplus, income stability) and the primary vulnerability (e.g. debt burden, low ledger balance).
5. Highlight data limitations (e.g. 6-month observation window, lack of collateral or credit bureau data).
6. Always include a standard non-binding regulatory disclaimer stating that this narrative interprets model factors and does not constitute a final legal lending commitment.

You must output STRICT JSON matching the following schema:
{
  "summary": "2-3 concise sentences summarizing the borrower's risk profile and cash flow resilience.",
  "positiveFactors": [
    "Key positive factor explaining how their financial behavior mitigates default risk."
  ],
  "riskFactors": [
    "Key vulnerability or exposure explaining what elevates risk."
  ],
  "dataLimitations": [
    "Observation window or data scope limitations (e.g. 6 months of transaction history, zero bureau history)."
  ],
  "scenarioComparison": null,
  "disclaimer": "This explanation interprets mathematical model factors and alternative cash flow metrics; it does not constitute a final credit approval or binding underwriting commitment."
}`;

/**
 * Format the user prompt payload from assessment and applicant data
 */
function buildUserPrompt({ assessment, summary, factors, dataCoverage }) {
  const payload = {
    applicationId: assessment.applicationId || assessment.application_id,
    assessmentId: assessment.assessmentId || assessment.id,
    authoritativeRiskResult: {
      score: assessment.riskScore ?? assessment.score,
      defaultProbability: assessment.defaultProbability ?? assessment.default_probability,
      riskBand: assessment.riskBand ?? assessment.risk_band,
      model: assessment.model?.name || 'Logistic Regression Baseline v1.0',
    },
    financialMetrics: {
      monthlyIncome: summary?.monthlyIncome || 0,
      monthlyExpenses: summary?.monthlyExpenses || 0,
      monthlyDebtObligations: summary?.monthlyEmi || 0,
      netCashFlowSurplus: summary?.cashFlowSurplus || 0,
      debtToIncomeRatio: summary?.debtToIncome || 0,
      savingsRate: summary?.savingsRate || 0,
      averageBalance: summary?.averageBalance || 0,
      incomeStabilityIndex: summary?.incomeStability ?? 0.8,
      failedPaymentsCount: summary?.failedPaymentCount || 0,
    },
    topPositiveModelDrivers: (factors?.positive || []).map((f) => ({
      feature: f.feature || f.feature_name || f.featureName || 'feature',
      contribution: f.contribution,
      description: f.description || f.impact || 'Positive factor',
    })),
    topNegativeModelDrivers: (factors?.negative || []).map((f) => ({
      feature: f.feature || f.feature_name || f.featureName || 'feature',
      contribution: f.contribution,
      description: f.description || f.impact || 'Risk factor',
    })),
    dataCoverage: {
      observationMonths: dataCoverage?.observationMonths || 6,
      alternativeDataUsed: true,
      bureauDataUsed: false,
      dataSources: dataCoverage?.dataSources || ['MANUAL_INPUT'],
    },
  };

  return `Please generate an underwriting explanation for the following alternative risk assessment:

${JSON.stringify(payload, null, 2)}

Ensure your response is valid JSON matching the requested schema.`;
}

module.exports = {
  PROMPT_VERSION,
  SYSTEM_INSTRUCTION,
  buildUserPrompt,
};
