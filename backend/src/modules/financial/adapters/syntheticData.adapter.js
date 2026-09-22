/**
 * Synthetic Data Adapter (Version 2)
 * Generates calibrated 24-month temporal credit histories and multi-month transaction ledgers
 * representing underserved borrower archetypes (thin-file gig workers, new-to-credit salaried,
 * micro-entrepreneurs, and distressed profiles).
 */

function generate24MonthTimeline({
  baseIncome,
  incomeVariance = 0.12,
  trendSlope = 0.0,
  seasonality = false,
  baseExpensesRatio = 0.60,
  monthlyEmi = 0,
  baseBalance = 15000,
  utilityDuePerMonth = 2,
  utilityOnTimeRatio = 0.95,
  avgTxCount = 60,
  digitalRatio = 0.88,
  failedPaymentMonths = [],
  nonDebtRecurring = 4000
}) {
  const months = [];
  const startYear = 2024;
  const startMonth = 10; // Oct 2024 to Sep 2026 (24 months)

  let balance = baseBalance;

  for (let i = 0; i < 24; i++) {
    const totalMonthIdx = startMonth + i;
    const year = startYear + Math.floor((totalMonthIdx - 1) / 12);
    const monthNum = ((totalMonthIdx - 1) % 12) + 1;
    const monthStr = `${year}-${String(monthNum).padStart(2, '0')}`;

    // Apply linear trend + seasonal multiplier + random monthly fluctuation
    const trendFactor = 1.0 + (trendSlope * (i / 23));
    let seasonalFactor = 1.0;
    if (seasonality && [9, 10, 11].includes(monthNum)) {
      seasonalFactor = 1.25; // Diwali / Festive festive sales boost
    } else if (seasonality && [5, 6].includes(monthNum)) {
      seasonalFactor = 0.88; // Summer lean period
    }

    // Pseudo-deterministic monthly variance based on month index
    const pseudoRand = Math.sin(i * 3.7) * 0.5 + 0.5;
    const monthlyVarianceFactor = 1.0 + (pseudoRand * 2 - 1) * incomeVariance;

    const income = Math.round(baseIncome * trendFactor * seasonalFactor * monthlyVarianceFactor);
    const expenseVariance = 1.0 + (Math.cos(i * 2.3) * 2 - 1) * 0.06;
    const expenses = Math.round(income * baseExpensesRatio * expenseVariance);
    const emi = monthlyEmi;
    const surplus = income - expenses - emi;

    balance = Math.max(800, Math.round(balance + surplus * 0.35));

    const failed = failedPaymentMonths.includes(i) ? 1 : 0;
    const utilDue = utilityDuePerMonth;
    const utilOnTime = Math.min(utilDue, Math.max(0, Math.round(utilDue * (utilityOnTimeRatio + (pseudoRand - 0.5) * 0.1))));

    const txCount = Math.round(avgTxCount * (0.9 + pseudoRand * 0.2));
    const digitalCount = Math.round(txCount * digitalRatio);

    months.push({
      month: monthStr,
      income,
      expenses,
      emi,
      endingBalance: balance,
      transactionCount: txCount,
      digitalTransactionCount: digitalCount,
      failedPayments: failed,
      utilityPaymentsDue: utilDue,
      utilityPaymentsOnTime: utilOnTime,
      recurringObligations: nonDebtRecurring,
      netCashFlow: surplus
    });
  }

  return months;
}

const PRESETS = {
  THIN_FILE_GIG_WORKER: {
    applicant: {
      fullName: 'Aarav Sharma',
      email: 'aarav.sharma@example.com',
      phone: '+919876543210',
      employmentType: 'CONTRACT',
      employmentTenureMonths: 24
    },
    targetProfile: {
      monthlyIncome: 42000,
      monthlyExpenses: 26000,
      monthlyEmi: 3500,
      averageBalance: 14200,
    },
    meta: {
      title: 'Thin-File Gig Worker',
      badge: '24-Month Active History',
      description: 'Variable weekly digital delivery payouts, disciplined fuel/vehicle expenses, zero traditional bureau records, 92% UPI transactions.',
      historyMonths: 24,
      indicativeIncome: 42000
    },
    generateHistory: () => generate24MonthTimeline({
      baseIncome: 41500,
      incomeVariance: 0.14,
      trendSlope: 0.08, // Mild positive growth (+8% over 24 months)
      seasonality: false,
      baseExpensesRatio: 0.62,
      monthlyEmi: 3500,
      baseBalance: 13500,
      utilityDuePerMonth: 2,
      utilityOnTimeRatio: 0.96,
      avgTxCount: 84,
      digitalRatio: 0.94,
      failedPaymentMonths: [7], // 1 occasional bounce in 24 months
      nonDebtRecurring: 3800
    }),
    sampleTransactions: [
      { transactionDate: '2026-08-05', amount: 10800, direction: 'CREDIT', category: 'SALARY', channel: 'UPI', merchant: 'Zomato Partner Payout' },
      { transactionDate: '2026-08-12', amount: 11400, direction: 'CREDIT', category: 'SALARY', channel: 'UPI', merchant: 'Swiggy Logistics' },
      { transactionDate: '2026-08-15', amount: 3500, direction: 'DEBIT', category: 'EMI', channel: 'AUTO_DEBIT', merchant: 'EV 2-Wheeler Loan' },
      { transactionDate: '2026-08-18', amount: 1200, direction: 'DEBIT', category: 'UTILITIES', channel: 'UPI', merchant: 'Airtel Broadband Prepaid' },
      { transactionDate: '2026-08-20', amount: 10200, direction: 'CREDIT', category: 'SALARY', channel: 'UPI', merchant: 'Porter Delivery Credit' },
      { transactionDate: '2026-08-26', amount: 4800, direction: 'DEBIT', category: 'GROCERIES', channel: 'UPI', merchant: 'Local Supermarket' }
    ]
  },

  NEW_TO_CREDIT_SALARIED: {
    applicant: {
      fullName: 'Pooja Verma',
      email: 'pooja.verma@example.com',
      phone: '+919876543211',
      employmentType: 'SALARIED',
      employmentTenureMonths: 24
    },
    targetProfile: {
      monthlyIncome: 65000,
      monthlyExpenses: 34000,
      monthlyEmi: 0,
      averageBalance: 32500,
    },
    meta: {
      title: 'New-to-Credit Salaried',
      badge: '24-Month Stable Salary',
      description: 'Consistent corporate payroll deposits, zero debt burden, 100% on-time utility settlements, high digital liquidity accumulation.',
      historyMonths: 24,
      indicativeIncome: 65000
    },
    generateHistory: () => generate24MonthTimeline({
      baseIncome: 64000,
      incomeVariance: 0.03,
      trendSlope: 0.07, // Salary appraisal increment
      seasonality: false,
      baseExpensesRatio: 0.50,
      monthlyEmi: 0,
      baseBalance: 32000,
      utilityDuePerMonth: 3,
      utilityOnTimeRatio: 1.0,
      avgTxCount: 52,
      digitalRatio: 0.88,
      failedPaymentMonths: [], // Zero failed payments
      nonDebtRecurring: 5500
    }),
    sampleTransactions: [
      { transactionDate: '2026-08-01', amount: 65000, direction: 'CREDIT', category: 'SALARY', channel: 'NETBANKING', merchant: 'Infosys Payroll Services' },
      { transactionDate: '2026-08-03', amount: 16000, direction: 'DEBIT', category: 'RENT', channel: 'UPI', merchant: 'Housr Apartment Rent' },
      { transactionDate: '2026-08-08', amount: 3200, direction: 'DEBIT', category: 'UTILITIES', channel: 'UPI', merchant: 'Tata Power Electricity' },
      { transactionDate: '2026-08-15', amount: 15000, direction: 'DEBIT', category: 'SAVINGS', channel: 'NETBANKING', merchant: 'HDFC Recurring Deposit' }
    ]
  },

  MICRO_ENTREPRENEUR: {
    applicant: {
      fullName: 'Ramesh Patel',
      email: 'ramesh.patel@example.com',
      phone: '+919876543212',
      employmentType: 'SELF_EMPLOYED',
      employmentTenureMonths: 36
    },
    targetProfile: {
      monthlyIncome: 88000,
      monthlyExpenses: 54000,
      monthlyEmi: 8500,
      averageBalance: 27500,
    },
    meta: {
      title: 'Micro-Entrepreneur',
      badge: '24-Month Merchant Ledger',
      description: 'High-volume UPI merchant QR collections, seasonal retail inventory replenishment cycles, active commercial utility lines.',
      historyMonths: 24,
      indicativeIncome: 88000
    },
    generateHistory: () => generate24MonthTimeline({
      baseIncome: 88500,
      incomeVariance: 0.16,
      trendSlope: 0.12, // Business expansion
      seasonality: true, // Festival Q3 peak
      baseExpensesRatio: 0.62,
      monthlyEmi: 8500,
      baseBalance: 28000,
      utilityDuePerMonth: 4,
      utilityOnTimeRatio: 0.95,
      avgTxCount: 130,
      digitalRatio: 0.85,
      failedPaymentMonths: [11], // 1 delayed mandate
      nonDebtRecurring: 7500
    }),
    sampleTransactions: [
      { transactionDate: '2026-08-02', amount: 28000, direction: 'CREDIT', category: 'TRANSFER', channel: 'UPI', merchant: 'PhonePe Merchant QR Settlement' },
      { transactionDate: '2026-08-08', amount: 34000, direction: 'CREDIT', category: 'TRANSFER', channel: 'UPI', merchant: 'Paytm Business Soundbox' },
      { transactionDate: '2026-08-10', amount: 8500, direction: 'DEBIT', category: 'EMI', channel: 'AUTO_DEBIT', merchant: 'Shop Inventory Equipment EMI' },
      { transactionDate: '2026-08-20', amount: 42000, direction: 'CREDIT', category: 'TRANSFER', channel: 'UPI', merchant: 'BharatPe Merchant Settlement' }
    ]
  },

  OVERLEVERAGED_STRESSED: {
    applicant: {
      fullName: 'Vikram Joshi',
      email: 'vikram.joshi@example.com',
      phone: '+919876543213',
      employmentType: 'CONTRACT',
      employmentTenureMonths: 14
    },
    meta: {
      title: 'Overleveraged Profile',
      badge: '24-Month Stress Pattern',
      description: 'Severe debt burden (EMI > 40%), 6 negative cash-flow months, multiple bounced mandates, declining 3-month trailing income trend.',
      historyMonths: 24,
      indicativeIncome: 33000
    },
    generateHistory: () => generate24MonthTimeline({
      baseIncome: 33000,
      incomeVariance: 0.15,
      trendSlope: -0.16, // Declining income trend
      seasonality: false,
      baseExpensesRatio: 0.74,
      monthlyEmi: 14000,
      baseBalance: 3200,
      utilityDuePerMonth: 2,
      utilityOnTimeRatio: 0.65, // Multiple delayed utility bills
      avgTxCount: 42,
      digitalRatio: 0.62,
      failedPaymentMonths: [4, 9, 15, 21], // 4 bounced payments
      nonDebtRecurring: 4500
    }),
    sampleTransactions: [
      { transactionDate: '2026-08-04', amount: 14000, direction: 'DEBIT', category: 'EMI', channel: 'AUTO_DEBIT', merchant: 'NBFC Personal Loan EMI' },
      { transactionDate: '2026-08-10', amount: 500, direction: 'DEBIT', category: 'OTHER', channel: 'AUTO_DEBIT', merchant: 'NACH Return Charges Insufficient Funds' },
      { transactionDate: '2026-08-15', amount: 15500, direction: 'CREDIT', category: 'SALARY', channel: 'UPI', merchant: 'Contract Freelance Advance' }
    ]
  }
};

class SyntheticDataAdapter {
  getAvailablePresets() {
    return Object.keys(PRESETS);
  }

  getPreset(presetName = 'THIN_FILE_GIG_WORKER') {
    const key = presetName.toUpperCase();
    if (!PRESETS[key]) {
      throw new Error(`Unknown synthetic preset: '${presetName}'. Available: ${Object.keys(PRESETS).join(', ')}`);
    }

    const presetConfig = PRESETS[key];
    const monthlyHistory = presetConfig.generateHistory();

    const avgIncome = Math.round(monthlyHistory.reduce((s, m) => s + m.income, 0) / monthlyHistory.length);
    const avgExpenses = Math.round(monthlyHistory.reduce((s, m) => s + m.expenses, 0) / monthlyHistory.length);
    const avgEmi = Math.round(monthlyHistory.reduce((s, m) => s + m.emi, 0) / monthlyHistory.length);
    const avgBalance = Math.round(monthlyHistory.reduce((s, m) => s + m.endingBalance, 0) / monthlyHistory.length);
    const failedCount = monthlyHistory.reduce((s, m) => s + m.failedPayments, 0);

    const target = presetConfig.targetProfile || {};
    const finalIncome = target.monthlyIncome || avgIncome;
    const finalExpenses = target.monthlyExpenses || avgExpenses;
    const finalEmi = target.monthlyEmi !== undefined ? target.monthlyEmi : avgEmi;
    const finalBalance = target.averageBalance || avgBalance;

    const financialProfile = {
      currency: 'INR',
      monthlyIncome: finalIncome,
      monthlyExpenses: finalExpenses,
      monthlyEmi: finalEmi,
      averageBalance: finalBalance,
      incomeVolatility: 0.12,
      expenseVolatility: 0.14,
      transactionRegularity: 0.88,
      savingsRate: Number((Math.max(0, finalIncome - finalExpenses - finalEmi) / finalIncome).toFixed(4)),
      failedPaymentCount: failedCount,
      nonDebtRecurringObligations: 4000,
      recurringObligationAmount: 4000,
      existingDebtAmount: finalEmi * 16,
      observationMonths: 24,
      monthlyHistory: monthlyHistory
    };

    return {
      presetId: key,
      applicant: presetConfig.applicant,
      meta: presetConfig.meta,
      financialProfile,
      sampleTransactions: presetConfig.sampleTransactions || []
    };
  }
}

module.exports = new SyntheticDataAdapter();
