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
    description: 'Average monthly credits/earnings detected from verifiable transactions or verified declarations.',
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
    description: 'Number of bounced debits, insufficient funds notices, or mandate failures over 6 months.',
    interpretation: 'Zero failed payments confirms active cash management discipline.',
  },
};

const RISK_METHODOLOGY = {
  scoreScale: {
    min: 0,
    max: 100,
    type: 'Alternative Cash-Flow Risk Score',
    description: 'Higher score signifies lower estimated probability of default and superior cash flow resilience.',
  },
  riskBands: {
    LOW: {
      range: '75 – 100',
      description: 'Low repayment risk. High cash surplus, low leverage, consistent inflow history.',
      policyGuidance: 'Recommended for standard underwriting approval.',
    },
    MODERATE: {
      range: '50 – 74',
      description: 'Moderate repayment risk. Balanced budget with manageable obligations.',
      policyGuidance: 'Recommended for conditional underwriting with structured limits or monitoring.',
    },
    HIGH: {
      range: '0 – 49',
      description: 'Elevated repayment risk. Tight or negative cash margin, elevated DTI, or erratic income.',
      policyGuidance: 'Requires analyst review, lower credit line, or collateral/guarantor support.',
    },
  },
  governance: {
    traditionalBureauDataUsed: false,
    fairLendingCompliant: true,
    authoritativeEngine: 'Scikit-Learn Logistic Regression Baseline',
    disclaimer: 'Score is strictly derived from verified banking cash flow patterns and cannot be overridden by language models.',
  },
};

/**
 * Tool declarations in OpenAPI/Gemini function declaration format
 */
const TOOL_DECLARATIONS = [
  {
    name: 'getFeatureDefinition',
    description: 'Lookup the financial definition, category, and underwriting interpretation of an engineered feature.',
    parameters: {
      type: 'OBJECT',
      properties: {
        featureName: {
          type: 'STRING',
          description: 'The feature key (e.g. debtToIncome, cashFlowSurplus, incomeStability, savingsRate).',
        },
      },
      required: ['featureName'],
    },
  },
  {
    name: 'getRiskMethodology',
    description: 'Retrieve the underwriting governance rules, 0-100 score scale, risk bands, and model documentation.',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
  },
];

/**
 * Dispatcher for executing read-only tools
 */
function executeTool(toolName, args) {
  switch (toolName) {
    case 'getFeatureDefinition': {
      const def = FEATURE_DEFINITIONS[args?.featureName];
      if (!def) {
        return {
          found: false,
          featureName: args?.featureName,
          availableFeatures: Object.keys(FEATURE_DEFINITIONS),
        };
      }
      return { found: true, ...def };
    }
    case 'getRiskMethodology': {
      return RISK_METHODOLOGY;
    }
    default:
      throw new Error(`Unknown or unauthorized tool: ${toolName}`);
  }
}

module.exports = {
  FEATURE_DEFINITIONS,
  RISK_METHODOLOGY,
  TOOL_DECLARATIONS,
  executeTool,
};
