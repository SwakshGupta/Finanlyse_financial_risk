const applicationService = require('./application.service');
const financialRepository = require('../repositories/financial.repository');
const applicationRepository = require('../repositories/application.repository');
const manualInputAdapter = require('../modules/financial/adapters/manualInput.adapter');
const syntheticDataAdapter = require('../modules/financial/adapters/syntheticData.adapter');
const csvTransactionAdapter = require('../modules/financial/adapters/csvTransaction.adapter');
const { deriveFinancialSummary } = require('../modules/financial/canonical.schema');
const { NotFoundError } = require('../utils/errors');

class FinancialService {
  async upsertProfile(applicationId, user, profileInput) {
    // Check permission and application existence
    const app = await applicationService.getApplication(applicationId, user);

    // Normalize via adapter
    const normalized = manualInputAdapter.normalizeProfile(profileInput);

    const saved = await financialRepository.upsertFinancialProfile(applicationId, normalized);

    // Transition application to READY_FOR_ASSESSMENT if it was DRAFT
    if (app.status === 'DRAFT') {
      await applicationRepository.update(applicationId, { status: 'READY_FOR_ASSESSMENT' });
    }

    return {
      applicationId,
      profile: {
        currency: saved.currency,
        monthlyIncome: parseFloat(saved.monthly_income),
        monthlyExpenses: parseFloat(saved.monthly_expenses),
        monthlyEmi: parseFloat(saved.existing_emi),
        averageBalance: parseFloat(saved.average_balance),
        incomeVolatility: normalized.incomeVolatility,
        expenseVolatility: normalized.expenseVolatility,
        transactionRegularity: normalized.transactionRegularity,
        savingsRate: normalized.savingsRate,
        failedPaymentCount: normalized.failedPaymentCount,
        recurringObligationAmount: normalized.recurringObligationAmount,
        existingDebtAmount: normalized.existingDebtAmount,
        observationMonths: normalized.observationMonths
      },
      updatedAt: saved.updated_at
    };
  }

  async addTransactions(applicationId, user, batchRequest) {
    await applicationService.getApplication(applicationId, user);

    const transactions = manualInputAdapter.normalizeTransactions(batchRequest.transactions);
    const inserted = await financialRepository.insertTransactions(applicationId, transactions);

    return {
      applicationId,
      acceptedCount: inserted.length,
      rejectedCount: 0,
      warnings: []
    };
  }

  async ingestCsvTransactions(applicationId, user, csvContent) {
    await applicationService.getApplication(applicationId, user);

    const { transactions, acceptedCount, rejectedCount, warnings } = csvTransactionAdapter.parseCsv(csvContent);
    await financialRepository.insertTransactions(applicationId, transactions);

    return {
      applicationId,
      acceptedCount,
      rejectedCount,
      warnings
    };
  }

  async ingestSyntheticPreset(applicationId, user, presetName = 'THIN_FILE_GIG_WORKER') {
    const preset = syntheticDataAdapter.getPreset(presetName);

    // Upsert synthetic financial profile
    const profileRes = await this.upsertProfile(applicationId, user, preset.financialProfile);

    // Ingest sample transactions
    let txResult = { acceptedCount: 0 };
    if (preset.sampleTransactions && preset.sampleTransactions.length > 0) {
      txResult = await this.addTransactions(applicationId, user, { transactions: preset.sampleTransactions });
    }

    return {
      applicationId,
      preset: presetName,
      profile: profileRes.profile,
      transactionsCount: txResult.acceptedCount
    };
  }

  async getFinancialSummary(applicationId, user) {
    await applicationService.getApplication(applicationId, user);

    const profileRecord = await financialRepository.getFinancialProfile(applicationId);
    if (!profileRecord) {
      throw new NotFoundError(`No financial profile found for application '${applicationId}'. Please add financial data first.`);
    }

    const transactions = await financialRepository.getTransactions(applicationId);

    const profile = {
      monthlyIncome: parseFloat(profileRecord.monthly_income),
      monthlyExpenses: parseFloat(profileRecord.monthly_expenses),
      monthlyEmi: parseFloat(profileRecord.existing_emi),
      averageBalance: parseFloat(profileRecord.average_balance),
      currency: profileRecord.currency
    };

    const summary = deriveFinancialSummary(profile, transactions);

    return {
      applicationId,
      summary,
      generatedAt: new Date().toISOString()
    };
  }
}

module.exports = new FinancialService();
