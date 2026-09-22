/**
 * Read-Only Underwriting Tools & Feature Catalog for LLM Explainability
 * 
 * Strict Architectural Rule:
 * Tools are strictly read-only, auditable, and deterministic.
 * Tools MUST NOT alter risk scores, determine loan decisions, or mutate application state.
 */

const FEATURE_DEFINITIONS = {
  monthlyIncome: {
    name: 'Monthly Income',
    category: 'CASH_FLOW',
    description: 'Average monthly credits/earnings detected from verifiable transactions or verified declarations over 24 months.',
    interpretation: 'Higher recurring income demonstrates stronger repayment capacity.',
  },
  monthlyExpenses: {
    name: 'Monthly Expenses',
    category: 'CASH_FLOW',
    description: 'Essential living expenses and recurring debits over the observation window.',
    interpretation: 'Lower baseline expenditures relative to income increase free operating cash flow.',
  },
  monthlyEmi: {
    name: 'Monthly Debt Obligations (EMI)',
    category: 'LEVERAGE',
    description: 'Committed monthly loan repayments, credit installments, or recurring obligations.',
    interpretation: 'Higher fixed debt obligations elevate default vulnerability.',
  },
  cashFlowSurplus: {
    name: 'Net Cash Flow Surplus',
    category: 'LIQUIDITY',
    description: 'Monthly income minus total monthly living expenditures and committed debt obligations.',
    interpretation: 'A positive cash surplus is the primary buffer protecting against financial shocks.',
  },
  debtToIncome: {
    name: 'Debt-to-Income (DTI) Ratio',
    category: 'LEVERAGE',
    description: 'Total monthly committed obligations divided by gross monthly income.',
    interpretation: 'DTI below 0.35 represents low leverage; DTI above 0.50 signals elevated debt burden.',
  },
  savingsRate: {
    name: 'Monthly Savings Rate',
    category: 'LIQUIDITY',
    description: 'Proportion of monthly income preserved after meeting all living costs and obligations.',
    interpretation: 'Savings rate above 20% indicates disciplined liquidity retention.',
  },
  averageBalance: {
    name: 'Average Ledger Balance',
    category: 'LIQUIDITY',
    description: 'Average daily balance maintained in primary transactional accounts.',
    interpretation: 'Higher steady balances cushion against unexpected short-term liquidity contractions.',
  },
  incomeStability: {
    name: 'Income Stability Index',
    category: 'STABILITY',
    description: 'Consistency of recurring deposits over time (0.0 to 1.0, where 1.0 is perfectly constant).',
    interpretation: 'Predictable income schedules facilitate dependable debt service.',
  },
  expenseVolatility: {
    name: 'Expense Volatility Index',
    category: 'STABILITY',
    description: 'Standard deviation of periodic expenses normalized against average outlays.',
    interpretation: 'Erratic expense spikes can temporarily constrain available liquidity.',
  },
  transactionRegularity: {
    name: 'Transaction Regularity Score',
    category: 'ENGAGEMENT',
    description: 'Frequency and distribution of active digital banking or UPI transactions.',
    interpretation: 'High regularity provides deep transaction auditability and lower thin-file information asymmetry.',
  },
  failedPaymentCount: {
    name: 'Failed / Bounced Payments',
    category: 'CREDIT_BEHAVIOR',
    description: 'Number of bounced debits, insufficient funds notices, or mandate failures.',
    interpretation: 'Zero failed payments confirms active cash management discipline.',
  },
  minimumBalanceRatio: {
    name: 'Minimum Balance Ratio (Liquidity Floor)',
    category: 'LIQUIDITY',
    description: 'Lowest observed balance divided by average monthly income across the 24-month timeline.',
    interpretation: 'A higher ratio indicates an enduring liquidity floor protecting against sudden overdrafts.',
  },
  negativeCashflowMonths: {
    name: 'Negative Cash-Flow Months',
    category: 'CASH_FLOW_STRESS',
    description: 'Count of observed historical months where expenses and debt commitments exceeded total inflows.',
    interpretation: 'Fewer negative cash-flow months confirms persistent operating solvency over time.',
  },
  incomeTrend3m: {
    name: '3-Month Income Trajectory Trend',
    category: 'TRAJECTORY',
    description: 'Trailing percentage change comparing recent 3-month income to earliest observation baseline.',
    interpretation: 'An expanding or stable trajectory reflects growing earning power and resilience.',
  },
  utilityPaymentConsistency: {
    name: 'Utility Payment Consistency',
    category: 'PAYMENT_DISCIPLINE',
    description: 'Proportion of recurring utility, electricity, and telecom invoices settled on or before due date.',
    interpretation: 'Consistently punctual utility payments demonstrate strong day-to-day payment discipline.',
  },
  digitalTransactionRatio: {
    name: 'Digital Transaction Adoption Ratio',
    category: 'BEHAVIORAL_METRIC',
    description: 'Proportion of financial activity processed over traceable digital rails (UPI, cards, net banking).',
    interpretation: 'Higher digital footprint provides transparent, auditable cash flow verification.',
  },
  nonDebtRecurringObligations: {
    name: 'Non-Debt Recurring Obligations',
    category: 'CASH_FLOW',
    description: 'Essential monthly living commitments like utilities, telecom, rent, and subscriptions (strictly excluding loan EMI).',
    interpretation: 'Lower non-debt fixed overhead preserves discretionary debt service capacity.',
  },
};

// Aliases for snake_case feature keys
FEATURE_DEFINITIONS.minimum_balance_ratio = FEATURE_DEFINITIONS.minimumBalanceRatio;
FEATURE_DEFINITIONS.negative_cashflow_months = FEATURE_DEFINITIONS.negativeCashflowMonths;
FEATURE_DEFINITIONS.income_trend_3m = FEATURE_DEFINITIONS.incomeTrend3m;
FEATURE_DEFINITIONS.utility_payment_consistency = FEATURE_DEFINITIONS.utilityPaymentConsistency;
FEATURE_DEFINITIONS.digital_transaction_ratio = FEATURE_DEFINITIONS.digitalTransactionRatio;
FEATURE_DEFINITIONS.non_debt_recurring_obligations = FEATURE_DEFINITIONS.nonDebtRecurringObligations;
FEATURE_DEFINITIONS.monthly_income = FEATURE_DEFINITIONS.monthlyIncome;
FEATURE_DEFINITIONS.monthly_expenses = FEATURE_DEFINITIONS.monthlyExpenses;
FEATURE_DEFINITIONS.monthly_emi = FEATURE_DEFINITIONS.monthlyEmi;
FEATURE_DEFINITIONS.cash_flow_surplus = FEATURE_DEFINITIONS.cashFlowSurplus;
FEATURE_DEFINITIONS.debt_to_income = FEATURE_DEFINITIONS.debtToIncome;
FEATURE_DEFINITIONS.average_balance = FEATURE_DEFINITIONS.averageBalance;
FEATURE_DEFINITIONS.income_stability = FEATURE_DEFINITIONS.incomeStability;
FEATURE_DEFINITIONS.expense_volatility = FEATURE_DEFINITIONS.expenseVolatility;
FEATURE_DEFINITIONS.transaction_regularity = FEATURE_DEFINITIONS.transactionRegularity;
FEATURE_DEFINITIONS.failed_payment_count = FEATURE_DEFINITIONS.failedPaymentCount;

const RISK_METHODOLOGY = {
  scoreScale: {
    min: 0,
    max: 100,
    type: 'Alternative Cash-Flow Risk Score (Model V2)',
    description: 'Higher score signifies lower estimated probability of default and superior 24-month cash-flow resilience.',
  },
  riskBands: {
    LOW: {
      range: '75 – 100',
      description: 'Low repayment risk. Sustained cash surplus, minimal negative months, high liquidity floor.',
      policyGuidance: 'Recommended for standard underwriting approval.',
    },
    MODERATE: {
      range: '50 – 74',
      description: 'Moderate repayment risk. Balanced budget with manageable obligations and adequate buffer.',
      policyGuidance: 'Recommended for conditional underwriting with structured limits or monitoring.',
    },
    HIGH: {
      range: '0 – 49',
      description: 'Elevated repayment risk. Tight cash margin, recurrent negative months, or high leverage.',
      policyGuidance: 'Requires analyst review, lower credit line, or collateral/guarantor support.',
    },
  },
  governance: {
    traditionalBureauDataUsed: false,
    alternativeCashFlowFocus: true,
  },
};

const UNDERWRITING_TOOLS = [
  {
    name: 'getFeatureDefinition',
    description: 'Retrieve the objective underwriting definition, metric category, and risk interpretation for a specific financial feature.',
    parameters: {
      type: 'OBJECT',
      properties: {
        featureName: {
          type: 'STRING',
          description: 'The exact key of the feature to explain (e.g. cashFlowSurplus, minimumBalanceRatio, incomeTrend3m, utilityPaymentConsistency).',
        },
      },
      required: ['featureName'],
    },
    execute: async ({ featureName }) => {
      const def = FEATURE_DEFINITIONS[featureName];
      if (!def) {
        return {
          found: false,
          error: `Feature '${featureName}' is not defined in the authoritative feature catalog.`,
          availableFeatures: Object.keys(FEATURE_DEFINITIONS),
        };
      }
      return { found: true, feature: featureName, ...def };
    },
  },
  {
    name: 'getRiskMethodology',
    description: 'Retrieve authoritative scoring scale details, risk band definitions, and policy guidance.',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
    execute: async () => RISK_METHODOLOGY,
  },
];

function executeTool(toolName, args = {}) {
  if (toolName === 'getFeatureDefinition') {
    const featureName = args.featureName;
    const def = FEATURE_DEFINITIONS[featureName];
    if (!def) {
      return {
        found: false,
        error: `Feature '${featureName}' is not defined in the authoritative feature catalog.`,
        availableFeatures: Object.keys(FEATURE_DEFINITIONS),
      };
    }
    return { found: true, feature: featureName, ...def };
  }
  if (toolName === 'getRiskMethodology') {
    return RISK_METHODOLOGY;
  }
  throw new Error(`Unknown or unauthorized tool: '${toolName}'`);
}

module.exports = {
  FEATURE_DEFINITIONS,
  RISK_METHODOLOGY,
  UNDERWRITING_TOOLS,
  executeTool,
};
