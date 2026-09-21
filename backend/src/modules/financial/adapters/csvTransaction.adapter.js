const manualInputAdapter = require('./manualInput.adapter');
const { ValidationError } = require('../../../utils/errors');

class CsvTransactionAdapter {
  /**
   * Parses CSV string/buffer into normalized transaction array
   * @param {string|Buffer} csvContent
   * @returns {{ transactions: Array, acceptedCount: number, rejectedCount: number, warnings: Array }}
   */
  parseCsv(csvContent) {
    if (!csvContent) {
      throw new ValidationError('CSV content cannot be empty');
    }

    const text = typeof csvContent === 'string' ? csvContent : csvContent.toString('utf8');
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

    if (lines.length < 2) {
      throw new ValidationError('CSV must contain a header line and at least one transaction row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    const rows = lines.slice(1);

    // Map column indexes
    const dateIdx = headers.findIndex(h => h.includes('date'));
    const amountIdx = headers.findIndex(h => h.includes('amount') || h.includes('value'));
    const directionIdx = headers.findIndex(h => h.includes('direction') || h.includes('type') || h.includes('dr/cr'));
    const categoryIdx = headers.findIndex(h => h.includes('category'));
    const channelIdx = headers.findIndex(h => h.includes('channel') || h.includes('mode'));
    const merchantIdx = headers.findIndex(h => h.includes('merchant') || h.includes('description') || h.includes('narration'));

    if (amountIdx === -1) {
      throw new ValidationError('CSV must contain an "amount" column');
    }

    const rawTxList = [];
    const warnings = [];
    let rejectedCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const line = rows[i];
      const cols = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));

      const rawAmount = parseFloat(cols[amountIdx]);
      if (isNaN(rawAmount) || rawAmount <= 0) {
        warnings.push(`Row ${i + 2}: skipped due to invalid amount '${cols[amountIdx]}'`);
        rejectedCount++;
        continue;
      }

      let direction = directionIdx !== -1 ? cols[directionIdx].toUpperCase() : 'DEBIT';
      if (direction === 'CR' || direction === 'CREDIT' || direction === 'INFLOW') {
        direction = 'CREDIT';
      } else {
        direction = 'DEBIT';
      }

      rawTxList.push({
        transactionDate: dateIdx !== -1 && cols[dateIdx] ? cols[dateIdx] : new Date().toISOString().split('T')[0],
        amount: rawAmount,
        direction,
        category: categoryIdx !== -1 && cols[categoryIdx] ? cols[categoryIdx] : 'OTHER',
        channel: channelIdx !== -1 && cols[channelIdx] ? cols[channelIdx] : 'OTHER',
        merchant: merchantIdx !== -1 && cols[merchantIdx] ? cols[merchantIdx] : 'CSV Transaction'
      });
    }

    const normalizedTransactions = manualInputAdapter.normalizeTransactions(rawTxList);

    return {
      transactions: normalizedTransactions,
      acceptedCount: normalizedTransactions.length,
      rejectedCount,
      warnings
    };
  }
}

module.exports = new CsvTransactionAdapter();
