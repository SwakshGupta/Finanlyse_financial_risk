/**
 * Synthetic Data Adapter
 * Generates calibrated synthetic applicant and financial benchmark records
 * representing underserved segments (thin-file, new-to-credit, micro-entrepreneurs).
 */

const PRESETS = {
  THIN_FILE_GIG_WORKER: {
    applicant: {
      fullName: 'Aarav Sharma',
      email: 'aarav.sharma@example.com',
      phone: '+919876543210',
      employmentType: 'CONTRACT',
      employmentTenureMonths: 18
    },
    financialProfile: {
      currency: 'INR',
      monthlyIncome: 42000,
      monthlyExpenses: 26000,
      monthlyEmi: 3500,
      averageBalance: 14200,
      incomeVolatility: 0.18,
      expenseVolatility: 0.14,
      transactionRegularity: 0.88,
      savingsRate: 0.29,
      failedPaymentCount: 0,
      recurringObligationAmount: 4000,
      existingDebtAmount: 25000,
      observationMonths: 12
    },
    sampleTransactions: [
      { transactionDate: '2026-08-05', amount: 10500, direction: 'CREDIT', category: 'SALARY', channel: 'UPI', merchant: 'Gig Platform Payout' },
      { transactionDate: '2026-08-12', amount: 11200, direction: 'CREDIT', category: 'SALARY', channel: 'UPI', merchant: 'Gig Platform Payout' },
      { transactionDate: '2026-08-15', amount: 3500, direction: 'DEBIT', category: 'EMI', channel: 'AUTO_DEBIT', merchant: 'Device Loan EMI' },
      { transactionDate: '2026-08-19', amount: 9800, direction: 'CREDIT', category: 'SALARY', channel: 'UPI', merchant: 'Gig Platform Payout' },
      { transactionDate: '2026-08-25', amount: 6200, direction: 'DEBIT', category: 'GROCERIES', channel: 'UPI', merchant: 'Local Mart' },
      { transactionDate: '2026-08-27', amount: 10500, direction: 'CREDIT', category: 'SALARY', channel: 'UPI', merchant: 'Gig Platform Payout' }
    ]
  },
  NEW_TO_CREDIT_SALARIED: {
    applicant: {
      fullName: 'Pooja Verma',
      email: 'pooja.verma@example.com',
      phone: '+919876543211',
      employmentType: 'SALARIED',
      employmentTenureMonths: 8
    },
    financialProfile: {
      currency: 'INR',
      monthlyIncome: 65000,
      monthlyExpenses: 34000,
      monthlyEmi: 0,
      averageBalance: 32500,
      incomeVolatility: 0.05,
      expenseVolatility: 0.10,
      transactionRegularity: 0.95,
      savingsRate: 0.48,
      failedPaymentCount: 0,
      recurringObligationAmount: 5000,
      existingDebtAmount: 0,
      observationMonths: 8
    },
    sampleTransactions: [
      { transactionDate: '2026-08-01', amount: 65000, direction: 'CREDIT', category: 'SALARY', channel: 'NETBANKING', merchant: 'Tech Corp Payroll' },
      { transactionDate: '2026-08-03', amount: 15000, direction: 'DEBIT', category: 'RENT', channel: 'UPI', merchant: 'Apartment Rent' },
      { transactionDate: '2026-08-10', amount: 4500, direction: 'DEBIT', category: 'UTILITIES', channel: 'NETBANKING', merchant: 'Power & Gas Utility' },
      { transactionDate: '2026-08-15', amount: 12000, direction: 'DEBIT', category: 'SAVINGS', channel: 'NETBANKING', merchant: 'Recurring Deposit' }
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
    financialProfile: {
      currency: 'INR',
      monthlyIncome: 88000,
      monthlyExpenses: 54000,
      monthlyEmi: 8500,
      averageBalance: 27500,
      incomeVolatility: 0.22,
      expenseVolatility: 0.19,
      transactionRegularity: 0.84,
      savingsRate: 0.29,
      failedPaymentCount: 1,
      recurringObligationAmount: 7000,
      existingDebtAmount: 85000,
      observationMonths: 12
    },
    sampleTransactions: [
      { transactionDate: '2026-08-02', amount: 24000, direction: 'CREDIT', category: 'TRANSFER', channel: 'UPI', merchant: 'Merchant Settlement' },
      { transactionDate: '2026-08-08', amount: 31000, direction: 'CREDIT', category: 'TRANSFER', channel: 'UPI', merchant: 'Merchant Settlement' },
      { transactionDate: '2026-08-10', amount: 8500, direction: 'DEBIT', category: 'EMI', channel: 'AUTO_DEBIT', merchant: 'Equipment Loan EMI' },
      { transactionDate: '2026-08-20', amount: 33000, direction: 'CREDIT', category: 'TRANSFER', channel: 'UPI', merchant: 'Merchant Settlement' }
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
    return JSON.parse(JSON.stringify(PRESETS[key]));
  }
}

module.exports = new SyntheticDataAdapter();
