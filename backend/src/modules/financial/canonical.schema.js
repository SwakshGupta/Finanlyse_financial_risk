/**
 * Canonical Financial Schema & Normalization Definitions
 * Conforms to Master Architecture (Section 11) & OpenAPI 3.0.3 Contract
 */

const ALLOWED_CATEGORIES = [
  'SALARY', 'RENT', 'GROCERIES', 'UTILITIES', 'EMI', 'LOAN_PAYMENT',
  'SHOPPING', 'FOOD', 'TRANSPORT', 'HEALTH', 'EDUCATION',
  'TRANSFER', 'SAVINGS', 'REFUND', 'OTHER'
];

const ALLOWED_CHANNELS = [
  'UPI', 'CARD', 'CASH', 'CHEQUE', 'NETBANKING', 'AUTO_DEBIT', 'OTHER'
];

const ALLOWED_DIRECTIONS = ['CREDIT', 'DEBIT'];

const ALLOWED_DATA_SOURCES = [
  'MANUAL_INPUT', 'SYNTHETIC', 'UPLOADED_STATEMENT', 'ACCOUNT_AGGREGATOR', 'BUREAU'
];

/**
 * Derives a standardized financial summary from profile data and transactions.
 * Calculates cashFlowSurplus, debtToIncome, and behavioral metrics.
 */
function deriveFinancialSummary(profile, transactions = []) {
  const monthlyIncome = Math.max(0, Number(profile.monthlyIncome || 0));
  const monthlyExpenses = Math.max(0, Number(profile.monthlyExpenses || 0));
  const monthlyEmi = Math.max(0, Number(profile.monthlyEmi || 0));
  const averageBalance = Number(profile.averageBalance || 0);

  // Core financial ratios
  const cashFlowSurplus = Number((monthlyIncome - monthlyExpenses - monthlyEmi).toFixed(2));
  const debtToIncome = monthlyIncome > 0
    ? Number((monthlyEmi / monthlyIncome).toFixed(4))
    : 0;

  // Transaction metrics if transactions are provided
  let calculatedFailedPayments = profile.failedPaymentCount || 0;
  let calculatedRegularity = profile.transactionRegularity !== undefined ? Number(profile.transactionRegularity) : 0.80;

  if (transactions.length > 0) {
    const failedTx = transactions.filter(t => 
      (t.category === 'OTHER' || t.category === 'EMI') && 
      t.description && /bounce|fail|return|insufficient/i.test(t.description)
    );
    if (failedTx.length > 0) {
      calculatedFailedPayments = Math.max(calculatedFailedPayments, failedTx.length);
    }
  }

  const incomeStability = profile.incomeVolatility !== undefined
    ? Number(Math.max(0, Math.min(1, 1 - profile.incomeVolatility)).toFixed(2))
    : 0.85;

  const expenseVolatility = profile.expenseVolatility !== undefined
    ? Number(Math.max(0, Math.min(1, profile.expenseVolatility)).toFixed(2))
    : 0.15;

  return {
    monthlyIncome,
    monthlyExpenses,
    monthlyEmi,
    cashFlowSurplus,
    debtToIncome,
    averageBalance,
    incomeStability,
    expenseVolatility,
    transactionRegularity: calculatedRegularity,
    failedPaymentCount: calculatedFailedPayments,
    observationMonths: profile.observationMonths || 6
  };
}

module.exports = {
  ALLOWED_CATEGORIES,
  ALLOWED_CHANNELS,
  ALLOWED_DIRECTIONS,
  ALLOWED_DATA_SOURCES,
  deriveFinancialSummary
};
