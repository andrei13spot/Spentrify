/**
 * Export Service
 * 
 * Handles generation of CSV and PDF exports for:
 * - UC-6: ITR Support (exportable summaries by deductible categories)
 * - UC-7: Reimbursement Mode (reimbursable expense reports)
 */

const db = require('../database/connection');
const encryptionService = require('./encryption');

/**
 * Generate ITR export (CSV format)
 * Groups expenses by deductible categories for Philippine ITR use
 * 
 * @param {number} userId - User ID
 * @param {string} startDate - Start date (ISO format)
 * @param {string} endDate - End date (ISO format)
 * @returns {Promise<string>} CSV content
 */
async function generateITRExport(userId, startDate, endDate) {
  // Get all transactions for the user in the date range
  const transactions = await db.query(
    `SELECT 
      t.transaction_id,
      t.amount_encrypted,
      t.merchant_name_encrypted,
      t.transaction_date,
      c.category_name,
      c.is_itr_deductible
    FROM Transactions t
    LEFT JOIN Categories c ON t.category_id = c.category_id
    WHERE t.user_id = ? 
      AND t.transaction_date >= ? 
      AND t.transaction_date <= ?
    ORDER BY c.is_itr_deductible DESC, c.category_name ASC, t.transaction_date DESC`,
    [userId, startDate, endDate]
  );

  // Decrypt and group by deductible status
  const deductibleExpenses = [];
  const nonDeductibleExpenses = [];
  let totalDeductible = 0;
  let totalNonDeductible = 0;

  transactions.forEach((row) => {
    const amount = parseFloat(encryptionService.decrypt(row.amount_encrypted));
    const merchant = row.merchant_name_encrypted
      ? encryptionService.decrypt(row.merchant_name_encrypted)
      : 'N/A';

    const expense = {
      date: row.transaction_date,
      category: row.category_name || 'Uncategorized',
      merchant,
      amount,
    };

    if (row.is_itr_deductible === 1) {
      deductibleExpenses.push(expense);
      totalDeductible += amount;
    } else {
      nonDeductibleExpenses.push(expense);
      totalNonDeductible += amount;
    }
  });

  // Generate CSV content
  let csv = 'SPENTRIFY ITR EXPORT REPORT\n';
  csv += `Period: ${startDate} to ${endDate}\n`;
  csv += `Generated: ${new Date().toISOString()}\n\n`;

  // Deductible Expenses Section
  csv += '═══════════════════════════════════════════════════════\n';
  csv += 'DEDUCTIBLE EXPENSES (FOR ITR)\n';
  csv += '═══════════════════════════════════════════════════════\n\n';
  csv += 'Date,Category,Merchant,Amount (PHP)\n';

  deductibleExpenses.forEach((exp) => {
    csv += `${exp.date},${exp.category},"${exp.merchant}",${exp.amount.toFixed(2)}\n`;
  });

  csv += `\nTOTAL DEDUCTIBLE: ₱${totalDeductible.toFixed(2)}\n\n`;

  // Non-Deductible Expenses Section (for reference)
  csv += '═══════════════════════════════════════════════════════\n';
  csv += 'NON-DEDUCTIBLE EXPENSES (REFERENCE ONLY)\n';
  csv += '═══════════════════════════════════════════════════════\n\n';
  csv += 'Date,Category,Merchant,Amount (PHP)\n';

  nonDeductibleExpenses.forEach((exp) => {
    csv += `${exp.date},${exp.category},"${exp.merchant}",${exp.amount.toFixed(2)}\n`;
  });

  csv += `\nTOTAL NON-DEDUCTIBLE: ₱${totalNonDeductible.toFixed(2)}\n\n`;

  // Summary
  csv += '═══════════════════════════════════════════════════════\n';
  csv += 'SUMMARY\n';
  csv += '═══════════════════════════════════════════════════════\n';
  csv += `Total Deductible Expenses: ₱${totalDeductible.toFixed(2)}\n`;
  csv += `Total Non-Deductible Expenses: ₱${totalNonDeductible.toFixed(2)}\n`;
  csv += `Grand Total: ₱${(totalDeductible + totalNonDeductible).toFixed(2)}\n`;

  return csv;
}

/**
 * Generate Reimbursement Export (CSV format)
 * Lists all reimbursable expenses with receipts for HR/employers
 * 
 * @param {number} userId - User ID
 * @param {string} startDate - Start date (ISO format)
 * @param {string} endDate - End date (ISO format)
 * @returns {Promise<string>} CSV content
 */
async function generateReimbursementExport(userId, startDate, endDate) {
  // Get all reimbursable transactions
  const transactions = await db.query(
    `SELECT 
      t.transaction_id,
      t.amount_encrypted,
      t.merchant_name_encrypted,
      t.transaction_date,
      t.receipt_image_path,
      c.category_name
    FROM Transactions t
    LEFT JOIN Categories c ON t.category_id = c.category_id
    WHERE t.user_id = ? 
      AND t.is_reimbursable = 1
      AND t.transaction_date >= ? 
      AND t.transaction_date <= ?
    ORDER BY t.transaction_date DESC`,
    [userId, startDate, endDate]
  );

  // Decrypt and format
  const reimbursableExpenses = transactions.map((row) => ({
    date: row.transaction_date,
    category: row.category_name || 'Uncategorized',
    merchant: row.merchant_name_encrypted
      ? encryptionService.decrypt(row.merchant_name_encrypted)
      : 'N/A',
    amount: parseFloat(encryptionService.decrypt(row.amount_encrypted)),
    receipt: row.receipt_image_path ? 'Yes' : 'No',
    receipt_path: row.receipt_image_path || 'N/A',
  }));

  const totalAmount = reimbursableExpenses.reduce(
    (sum, exp) => sum + exp.amount,
    0
  );

  // Generate CSV content
  let csv = 'SPENTRIFY REIMBURSEMENT EXPENSE REPORT\n';
  csv += `Period: ${startDate} to ${endDate}\n`;
  csv += `Generated: ${new Date().toISOString()}\n\n`;

  csv += '═══════════════════════════════════════════════════════\n';
  csv += 'REIMBURSABLE EXPENSES\n';
  csv += '═══════════════════════════════════════════════════════\n\n';
  csv += 'Date,Category,Merchant,Amount (PHP),Receipt Attached,Receipt Path\n';

  reimbursableExpenses.forEach((exp) => {
    csv += `${exp.date},${exp.category},"${exp.merchant}",${exp.amount.toFixed(2)},${exp.receipt},"${exp.receipt_path}"\n`;
  });

  csv += `\n═══════════════════════════════════════════════════════\n`;
  csv += `TOTAL REIMBURSABLE AMOUNT: ₱${totalAmount.toFixed(2)}\n`;
  csv += `NUMBER OF EXPENSES: ${reimbursableExpenses.length}\n`;

  return csv;
}

/**
 * Get ITR summary by category
 * Returns summary grouped by deductible categories
 * 
 * @param {number} userId - User ID
 * @param {string} startDate - Start date (ISO format)
 * @param {string} endDate - End date (ISO format)
 * @returns {Promise<Object>} Summary object
 */
async function getITRSummary(userId, startDate, endDate) {
  const transactions = await db.query(
    `SELECT 
      t.amount_encrypted,
      c.category_name,
      c.is_itr_deductible
    FROM Transactions t
    LEFT JOIN Categories c ON t.category_id = c.category_id
    WHERE t.user_id = ? 
      AND t.transaction_date >= ? 
      AND t.transaction_date <= ?`,
    [userId, startDate, endDate]
  );

  const categoryTotals = {};
  let totalDeductible = 0;
  let totalNonDeductible = 0;

  transactions.forEach((row) => {
    const amount = parseFloat(encryptionService.decrypt(row.amount_encrypted));
    const category = row.category_name || 'Uncategorized';
    const isDeductible = row.is_itr_deductible === 1;

    if (!categoryTotals[category]) {
      categoryTotals[category] = {
        category,
        isDeductible,
        total: 0,
      };
    }

    categoryTotals[category].total += amount;

    if (isDeductible) {
      totalDeductible += amount;
    } else {
      totalNonDeductible += amount;
    }
  });

  return {
    categoryTotals: Object.values(categoryTotals),
    totalDeductible,
    totalNonDeductible,
    grandTotal: totalDeductible + totalNonDeductible,
  };
}

module.exports = {
  generateITRExport,
  generateReimbursementExport,
  getITRSummary,
};
