const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class FinancialRepository {
  async upsertFinancialProfile(applicationId, profile) {
    const profId = `fin_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    const query = `
      INSERT INTO financial_profiles (
        id, application_id, monthly_income, monthly_expenses, average_balance,
        savings_balance, existing_emi, currency, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      ON CONFLICT (application_id) DO UPDATE SET
        monthly_income = EXCLUDED.monthly_income,
        monthly_expenses = EXCLUDED.monthly_expenses,
        average_balance = EXCLUDED.average_balance,
        savings_balance = EXCLUDED.savings_balance,
        existing_emi = EXCLUDED.existing_emi,
        currency = EXCLUDED.currency,
        updated_at = NOW()
      RETURNING *;
    `;

    const result = await db.query(query, [
      profId,
      applicationId,
      profile.monthlyIncome,
      profile.monthlyExpenses,
      profile.averageBalance,
      profile.savingsBalance || (profile.monthlyIncome - profile.monthlyExpenses),
      profile.monthlyEmi,
      profile.currency || 'INR'
    ]);

    return result.rows[0];
  }

  async getFinancialProfile(applicationId) {
    const query = `
      SELECT * FROM financial_profiles
      WHERE application_id = $1
      LIMIT 1;
    `;
    const result = await db.query(query, [applicationId]);
    return result.rows[0] || null;
  }

  async insertTransactions(applicationId, transactions = []) {
    if (transactions.length === 0) {
      return [];
    }

    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      const inserted = [];

      for (const tx of transactions) {
        const txId = `tx_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
        const query = `
          INSERT INTO transactions (
            id, application_id, date, amount, type, category, description, balance_after, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
          RETURNING *;
        `;
        const res = await client.query(query, [
          txId,
          applicationId,
          tx.transactionDate,
          tx.amount,
          tx.direction,
          tx.category,
          tx.merchant || tx.description || 'Transaction',
          tx.balanceAfter || null
        ]);
        inserted.push(res.rows[0]);
      }

      await client.query('COMMIT');
      return inserted;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getTransactions(applicationId) {
    const query = `
      SELECT * FROM transactions
      WHERE application_id = $1
      ORDER BY date DESC, created_at DESC;
    `;
    const result = await db.query(query, [applicationId]);
    return result.rows;
  }
}

module.exports = new FinancialRepository();
