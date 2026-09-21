const { ALLOWED_CATEGORIES, ALLOWED_CHANNELS, ALLOWED_DIRECTIONS } = require('../canonical.schema');
const { ValidationError } = require('../../../utils/errors');

class ManualInputAdapter {
  /**
   * Normalizes manual financial profile input
   */
  normalizeProfile(raw) {
    if (!raw || typeof raw !== 'object') {
      throw new ValidationError('Financial profile data must be an object');
    }

    const monthlyIncome = Number(raw.monthlyIncome);
    const monthlyExpenses = Number(raw.monthlyExpenses);
    const monthlyEmi = Number(raw.monthlyEmi !== undefined ? raw.monthlyEmi : 0);
    const averageBalance = Number(raw.averageBalance !== undefined ? raw.averageBalance : 0);

    if (isNaN(monthlyIncome) || monthlyIncome < 0) {
      throw new ValidationError('monthlyIncome must be a non-negative number');
    }
    if (isNaN(monthlyExpenses) || monthlyExpenses < 0) {
      throw new ValidationError('monthlyExpenses must be a non-negative number');
    }
    if (isNaN(monthlyEmi) || monthlyEmi < 0) {
      throw new ValidationError('monthlyEmi must be a non-negative number');
    }
    if (isNaN(averageBalance)) {
      throw new ValidationError('averageBalance must be a valid number');
    }

    return {
      currency: (raw.currency || 'INR').toUpperCase(),
      monthlyIncome: Number(monthlyIncome.toFixed(2)),
      monthlyExpenses: Number(monthlyExpenses.toFixed(2)),
      monthlyEmi: Number(monthlyEmi.toFixed(2)),
      averageBalance: Number(averageBalance.toFixed(2)),
      incomeVolatility: raw.incomeVolatility !== undefined ? Math.max(0, Number(raw.incomeVolatility)) : 0.15,
      expenseVolatility: raw.expenseVolatility !== undefined ? Math.max(0, Number(raw.expenseVolatility)) : 0.12,
      transactionRegularity: raw.transactionRegularity !== undefined ? Math.min(1, Math.max(0, Number(raw.transactionRegularity))) : 0.85,
      savingsRate: raw.savingsRate !== undefined ? Number(raw.savingsRate) : Number(((monthlyIncome - monthlyExpenses) / (monthlyIncome || 1)).toFixed(2)),
      failedPaymentCount: raw.failedPaymentCount !== undefined ? Math.max(0, parseInt(raw.failedPaymentCount, 10)) : 0,
      recurringObligationAmount: raw.recurringObligationAmount !== undefined ? Math.max(0, Number(raw.recurringObligationAmount)) : 0,
      existingDebtAmount: raw.existingDebtAmount !== undefined ? Math.max(0, Number(raw.existingDebtAmount)) : 0,
      observationMonths: raw.observationMonths ? Math.min(60, Math.max(1, parseInt(raw.observationMonths, 10))) : 6
    };
  }

  /**
   * Normalizes an array of raw transactions
   */
  normalizeTransactions(transactions = []) {
    if (!Array.isArray(transactions)) {
      throw new ValidationError('transactions must be an array');
    }

    return transactions.map((tx, idx) => {
      if (!tx || typeof tx !== 'object') {
        throw new ValidationError(`Transaction at index ${idx} is invalid`);
      }

      const amount = Number(tx.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new ValidationError(`Transaction at index ${idx}: amount must be greater than 0`);
      }

      const direction = (tx.direction || '').toUpperCase();
      if (!ALLOWED_DIRECTIONS.includes(direction)) {
        throw new ValidationError(`Transaction at index ${idx}: direction must be CREDIT or DEBIT`);
      }

      const category = (tx.category || 'OTHER').toUpperCase();
      const validCategory = ALLOWED_CATEGORIES.includes(category) ? category : 'OTHER';

      const channel = (tx.channel || 'OTHER').toUpperCase();
      const validChannel = ALLOWED_CHANNELS.includes(channel) ? channel : 'OTHER';

      return {
        transactionDate: tx.transactionDate || new Date().toISOString().split('T')[0],
        amount: Number(amount.toFixed(2)),
        direction,
        category: validCategory,
        channel: validChannel,
        merchant: (tx.merchant || tx.description || 'N/A').slice(0, 160),
        reference: (tx.reference || `ref_${idx}_${Date.now()}`).slice(0, 100)
      };
    });
  }
}

module.exports = new ManualInputAdapter();
