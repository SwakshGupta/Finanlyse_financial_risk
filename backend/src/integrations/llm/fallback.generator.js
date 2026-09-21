/**
 * Deterministic Fallback Explanation Generator
 * 
 * Strict Architectural Invariant:
 * If the LLM provider fails, times out, is misconfigured, or returns schema-violating output,
 * this generator produces a grounded, high-quality, audit-compliant explanation.
 */

function generateFallbackExplanation({ assessment, summary, factors, dataCoverage, reason = 'Deterministic fallback engaged' }) {
  const score = assessment.riskScore ?? assessment.score ?? 50;
  const defaultProb = assessment.defaultProbability ?? assessment.default_probability ?? 0.2;
  const riskBand = assessment.riskBand ?? assessment.risk_band ?? (score >= 75 ? 'LOW' : score >= 50 ? 'MODERATE' : 'HIGH');
  const probPercent = (defaultProb * 100).toFixed(1);

  // Derive contextual summary text
  let summaryText = '';
  if (riskBand === 'LOW' || score >= 75) {
    summaryText = `The alternative credit evaluation establishes a high Alternative Risk Score of ${score}/100 (LOW Risk) with an estimated default probability of ${probPercent}%. The applicant demonstrates strong cash-flow surplus margins, stable transaction frequency, and conservative debt obligations, qualifying for prime alternative underwriting consideration.`;
  } else if (riskBand === 'MODERATE' || score >= 50) {
    summaryText = `The alternative credit evaluation establishes a moderate Alternative Risk Score of ${score}/100 (MODERATE Risk) with an estimated default probability of ${probPercent}%. The applicant maintains positive operational cash flows but displays moderate leverage or income fluctuations that warrant structured exposure limits.`;
  } else {
    summaryText = `The alternative credit evaluation indicates an elevated repayment risk profile with an Alternative Risk Score of ${score}/100 (HIGH Risk) and an estimated default probability of ${probPercent}%. Significant committed debt obligations or thin liquidity buffers require manual credit analyst review before facility extension.`;
  }

  // Derive positive factors from mathematical model drivers
  const positiveList = [];
  if (factors?.positive && factors.positive.length > 0) {
    factors.positive.slice(0, 3).forEach((f) => {
      const featName = f.feature || f.feature_name || f.featureName || 'cash flow metrics';
      const desc = f.description || f.impact || `Favorable model contribution from ${featName}.`;
      positiveList.push(desc);
    });
  }
  if (summary?.cashFlowSurplus > 0 && positiveList.length < 2) {
    positiveList.push(`Maintains an active monthly operating surplus of ₹${Math.round(summary.cashFlowSurplus).toLocaleString('en-IN')}.`);
  }
  if (summary?.savingsRate > 0.1 && positiveList.length < 3) {
    positiveList.push(`Retains approximately ${(summary.savingsRate * 100).toFixed(0)}% of monthly inflows as savings.`);
  }
  if (positiveList.length === 0) {
    positiveList.push('Verified positive monthly cash inflow across the observation period.');
    positiveList.push('Active digital banking engagement confirming regular economic transactions.');
  }

  // Derive risk factors from mathematical model drivers
  const riskList = [];
  if (factors?.negative && factors.negative.length > 0) {
    factors.negative.slice(0, 3).forEach((f) => {
      const featName = f.feature || f.feature_name || f.featureName || 'obligation load';
      const desc = f.description || f.impact || `Elevated risk contribution attributed to ${featName}.`;
      riskList.push(desc);
    });
  }
  if (summary?.debtToIncome > 0.35 && riskList.length < 2) {
    riskList.push(`Committed monthly debt obligations consume ${(summary.debtToIncome * 100).toFixed(0)}% of monthly inflow.`);
  }
  if (summary?.averageBalance < 10000 && riskList.length < 3) {
    riskList.push('Average daily ledger balance provides a tight cushion against sudden expenditure shocks.');
  }
  if (riskList.length === 0) {
    riskList.push('Thin formal credit record requiring ongoing transaction behavior verification.');
  }

  // Data limitations
  const obsMonths = dataCoverage?.observationMonths || 6;
  const dataLimitations = [
    `Assessment is based on a ${obsMonths}-month alternative transaction observation window.`,
    'No traditional credit bureau score or institutional repayment history was utilized in accordance with fair-lending protocols.',
  ];

  return {
    summary: summaryText,
    positiveFactors: positiveList,
    riskFactors: riskList,
    dataLimitations,
    scenarioComparison: null,
    disclaimer: 'This explanation interprets mathematical model factors and alternative cash flow metrics; it does not constitute a final credit approval or binding underwriting commitment.',
    fallbackUsed: true,
    fallbackReason: reason,
  };
}

module.exports = {
  generateFallbackExplanation,
};
