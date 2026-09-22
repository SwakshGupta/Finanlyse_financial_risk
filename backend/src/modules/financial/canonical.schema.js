/**
 * Canonical Financial Schema & Normalization Definitions
 * Conforms to Master Architecture (Section 11) & OpenAPI 3.0.3 Contract
 * Supports 24-Month Temporal Financial History and Feature Set V2
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
 * Derives a standardized financial summary from profile data, monthly history, and transactions.
 * Calculates Feature Set V2 metrics including 24-month temporal behaviors.
 */
function deriveFinancialSummary(profile = {}, transactions = []) {
  const monthlyHistory = Array.isArray(profile.monthlyHistory) && profile.monthlyHistory.length > 0
    ? profile.monthlyHistory
    : null;

  let monthlyIncome = Math.max(0, Number(profile.monthlyIncome || 0));
  let monthlyExpenses = Math.max(0, Number(profile.monthlyExpenses || 0));
  let monthlyEmi = Math.max(0, Number(profile.monthlyEmi || 0));
  let averageBalance = Number(profile.averageBalance || 0);
  let observationMonths = profile.observationMonths || (monthlyHistory ? monthlyHistory.length : 24);

  let minimumBalanceRatio = 0.20;
  let negativeCashflowMonths = 0;
  let incomeTrend3m = 0.02;
  let utilityPaymentConsistency = 0.90;
  let digitalTransactionRatio = 0.85;
  let nonDebtRecurringObligations = Number(profile.nonDebtRecurringObligations || profile.recurringObligationAmount || 4000);

  let incomeHistory = [];

  if (monthlyHistory) {
    observationMonths = monthlyHistory.length;
    const incomes = monthlyHistory.map(m => Number(m.income || 0));
    const expenses = monthlyHistory.map(m => Number(m.expenses || 0));
    const emis = monthlyHistory.map(m => Number(m.emi || 0));
    const balances = monthlyHistory.map(m => Number(m.endingBalance || m.balance || 0));

    monthlyIncome = Math.round(incomes.reduce((a, b) => a + b, 0) / incomes.length);
    monthlyExpenses = Math.round(expenses.reduce((a, b) => a + b, 0) / expenses.length);
    monthlyEmi = Math.round(emis.reduce((a, b) => a + b, 0) / emis.length);
    averageBalance = Math.round(balances.reduce((a, b) => a + b, 0) / balances.length);

    // FEATURE 1: minimum_balance_ratio
    const minObservedBalance = balances.length > 0 ? Math.min(...balances) : averageBalance * 0.4;
    minimumBalanceRatio = monthlyIncome > 0
      ? Number((minObservedBalance / monthlyIncome).toFixed(4))
      : 0.10;

    // FEATURE 2: negative_cashflow_months
    negativeCashflowMonths = monthlyHistory.filter(m => {
      const net = (Number(m.income) - Number(m.expenses) - Number(m.emi));
      return net < 0;
    }).length;

    // FEATURE 3: income_trend_3m
    if (incomes.length >= 6) {
      const earliest3m = (incomes[0] + incomes[1] + incomes[2]) / 3;
      const latest3m = (incomes[incomes.length - 1] + incomes[incomes.length - 2] + incomes[incomes.length - 3]) / 3;
      incomeTrend3m = earliest3m > 0
        ? Number(((latest3m - earliest3m) / earliest3m).toFixed(4))
        : 0.0;
    }

    // FEATURE 4: utility_payment_consistency
    const totalUtilityDue = monthlyHistory.reduce((s, m) => s + (m.utilityPaymentsDue || 0), 0);
    const totalUtilityOnTime = monthlyHistory.reduce((s, m) => s + (m.utilityPaymentsOnTime || 0), 0);
    if (totalUtilityDue > 0) {
      utilityPaymentConsistency = Number((totalUtilityOnTime / totalUtilityDue).toFixed(4));
    }

    // FEATURE 5: digital_transaction_ratio
    const totalTx = monthlyHistory.reduce((s, m) => s + (m.transactionCount || 0), 0);
    const totalDigitalTx = monthlyHistory.reduce((s, m) => s + (m.digitalTransactionCount || 0), 0);
    if (totalTx > 0) {
      digitalTransactionRatio = Number((totalDigitalTx / totalTx).toFixed(4));
    }

    // Non-debt recurring obligations
    const recArr = monthlyHistory.map(m => Number(m.recurringObligations || 0)).filter(v => v > 0);
    if (recArr.length > 0) {
      nonDebtRecurringObligations = Math.round(recArr.reduce((a, b) => a + b, 0) / recArr.length);
    }

    incomeHistory = monthlyHistory.map(m => ({
      month: m.month,
      income: Number(m.income),
      expenses: Number(m.expenses),
      emi: Number(m.emi),
      endingBalance: Number(m.endingBalance || m.balance || 0),
      netCashFlow: Number(m.income) - Number(m.expenses) - Number(m.emi)
    }));
  } else {
    // Fallback if raw monthly series was not provided (e.g. manual single-month form)
    minimumBalanceRatio = monthlyIncome > 0 ? Number(((averageBalance * 0.40) / monthlyIncome).toFixed(4)) : 0.15;
    negativeCashflowMonths = (monthlyIncome - monthlyExpenses - monthlyEmi) < 0 ? 1 : 0;
    incomeTrend3m = 0.0;
    utilityPaymentConsistency = 0.88;
    digitalTransactionRatio = 0.82;

    // Synthesize 24-month timeline for graph visualization based on stated profile
    const startYear = 2024;
    const startMonth = 10;
    for (let i = 0; i < 24; i++) {
      const totalMonthIdx = startMonth + i;
      const yr = startYear + Math.floor((totalMonthIdx - 1) / 12);
      const mNum = ((totalMonthIdx - 1) % 12) + 1;
      const mStr = `${yr}-${String(mNum).padStart(2, '0')}`;
      const factor = 1.0 + (Math.sin(i * 1.5) * 0.06);
      const inc = Math.round(monthlyIncome * factor);
      const exp = Math.round(monthlyExpenses * (1.0 + (Math.cos(i * 1.2) * 0.04)));
      incomeHistory.push({
        month: mStr,
        income: inc,
        expenses: exp,
        emi: monthlyEmi,
        endingBalance: Math.round(averageBalance * (0.9 + Math.sin(i * 0.8) * 0.15)),
        netCashFlow: inc - exp - monthlyEmi
      });
    }
  }

  // Core financial ratios
  const cashFlowSurplus = Number((monthlyIncome - monthlyExpenses - monthlyEmi).toFixed(2));
  const debtToIncome = monthlyIncome > 0
    ? Number((monthlyEmi / monthlyIncome).toFixed(4))
    : 0;

  // Transaction metrics if transactions are provided
  let calculatedFailedPayments = profile.failedPaymentCount || 0;
  let calculatedRegularity = profile.transactionRegularity !== undefined ? Number(profile.transactionRegularity) : 0.85;

  if (transactions.length > 0) {
    const failedTx = transactions.filter(t => 
      (t.category === 'OTHER' || t.category === 'EMI') && 
      t.description && /bounce|fail|return|insufficient/i.test(t.description)
    );
    if (failedTx.length > 0) {
      calculatedFailedPayments = Math.max(calculatedFailedPayments, failedTx.length);
    }

    const digitalTx = transactions.filter(t => 
      ['UPI', 'CARD', 'NETBANKING', 'AUTO_DEBIT'].includes(t.channel) ||
      (t.description && /upi|gpay|phonepe|paytm|netbanking|card/i.test(t.description))
    );
    if (transactions.length >= 5) {
      digitalTransactionRatio = Number((digitalTx.length / transactions.length).toFixed(3));
    }
  }

  const incomeStability = profile.incomeVolatility !== undefined
    ? Number(Math.max(0, Math.min(1, 1 - profile.incomeVolatility)).toFixed(2))
    : 0.85;

  const expenseVolatility = profile.expenseVolatility !== undefined
    ? Number(Math.max(0, Math.min(1, profile.expenseVolatility)).toFixed(2))
    : 0.15;

  // Trajectory qualitative label
  let incomeTrendLabel = 'Stable';
  if (incomeTrend3m > 0.03) incomeTrendLabel = 'Improving';
  else if (incomeTrend3m < -0.03) incomeTrendLabel = 'Declining';

  return {
    monthlyIncome,
    monthlyExpenses,
    monthlyEmi,
    cashFlowSurplus,
    debtToIncome,
    averageBalance,
    minimumBalanceRatio,
    incomeStability,
    expenseVolatility,
    transactionRegularity: calculatedRegularity,
    negativeCashflowMonths,
    incomeTrend3m,
    utilityPaymentConsistency,
    digitalTransactionRatio,
    savingsRate: monthlyIncome > 0 ? Number((Math.max(0, cashFlowSurplus) / monthlyIncome).toFixed(4)) : 0,
    failedPaymentCount: calculatedFailedPayments,
    nonDebtRecurringObligations,
    recurringObligationAmount: nonDebtRecurringObligations, // backward compatibility
    existingDebtAmount: profile.existingDebtAmount || (monthlyEmi * 15),
    observationMonths,
    incomeHistory,
    trajectoryInsights: {
      incomeTrend: incomeTrendLabel,
      trendPercentage: Number((incomeTrend3m * 100).toFixed(1)),
      negativeCashflowMonths,
      totalObservedMonths: observationMonths,
      minimumBalanceRatio,
      utilityPaymentConsistency: Number((utilityPaymentConsistency * 100).toFixed(0)),
      digitalTransactionRatio: Number((digitalTransactionRatio * 100).toFixed(0))
    }
  };
}

module.exports = {
  ALLOWED_CATEGORIES,
  ALLOWED_CHANNELS,
  ALLOWED_DIRECTIONS,
  ALLOWED_DATA_SOURCES,
  deriveFinancialSummary
};
