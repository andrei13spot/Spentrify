// simple service for working with transactions
// this file keeps the encryption logic close to the queries

const db = require('../database/connection');
const encryptionService = require('./encryption');

async function getAllTransactions(userId) {
  const rows = await db.query(
    `SELECT 
      transaction_id, 
      user_id, 
      category_id,
      amount_encrypted, 
      merchant_name_encrypted, 
      transaction_date, 
      source_type,
      reference_number,
      is_manual,
      is_reimbursable,
      receipt_image_path,
      created_at 
    FROM Transactions 
    WHERE user_id = ? 
    ORDER BY transaction_date DESC, created_at DESC`,
    [userId]
  );

  // Decrypt sensitive data before sending back to the client
  return rows.map((row) => ({
    transaction_id: row.transaction_id,
    user_id: row.user_id,
    category_id: row.category_id,
    amount: parseFloat(encryptionService.decrypt(row.amount_encrypted)),
    merchant_name: row.merchant_name_encrypted
      ? encryptionService.decrypt(row.merchant_name_encrypted)
      : null,
    transaction_date: row.transaction_date,
    source_type: row.source_type,
    reference_number: row.reference_number,
    is_manual: row.is_manual === 1,
    is_reimbursable: row.is_reimbursable === 1,
    receipt_image_path: row.receipt_image_path,
    created_at: row.created_at
  }));
}

async function getTransactionById(id, userId) {
  const rows = await db.query(
    `SELECT 
      transaction_id, 
      user_id, 
      category_id,
      amount_encrypted, 
      merchant_name_encrypted, 
      transaction_date, 
      source_type,
      reference_number,
      is_manual,
      is_reimbursable,
      receipt_image_path,
      created_at 
    FROM Transactions 
    WHERE transaction_id = ? AND user_id = ? 
    LIMIT 1`,
    [id, userId]
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    transaction_id: row.transaction_id,
    user_id: row.user_id,
    category_id: row.category_id,
    amount: parseFloat(encryptionService.decrypt(row.amount_encrypted)),
    merchant_name: row.merchant_name_encrypted
      ? encryptionService.decrypt(row.merchant_name_encrypted)
      : null,
    transaction_date: row.transaction_date,
    source_type: row.source_type,
    reference_number: row.reference_number,
    is_manual: row.is_manual === 1,
    is_reimbursable: row.is_reimbursable === 1,
    receipt_image_path: row.receipt_image_path,
    created_at: row.created_at
  };
}

async function createTransaction(transactionData) {
  // Encrypt sensitive data before saving
  const amountEncrypted = encryptionService.encrypt(
    transactionData.amount.toString()
  );
  const merchantNameEncrypted = transactionData.merchant_name
    ? encryptionService.encrypt(transactionData.merchant_name)
    : null;

  const result = await db.run(
    `INSERT INTO Transactions (
      user_id, 
      category_id,
      amount_encrypted, 
      merchant_name_encrypted, 
      transaction_date,
      source_type,
      reference_number,
      is_manual,
      is_reimbursable,
      receipt_image_path
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      transactionData.user_id,
      transactionData.category_id || null,
      amountEncrypted,
      merchantNameEncrypted,
      transactionData.transaction_date || new Date().toISOString(),
      transactionData.source_type || null,
      transactionData.reference_number || null,
      transactionData.is_manual ? 1 : 0,
      transactionData.is_reimbursable ? 1 : 0,
      transactionData.receipt_image_path || null
    ]
  );

  // Return plain values (not encrypted) for client
  return {
    transaction_id: result.lastID,
    user_id: transactionData.user_id,
    category_id: transactionData.category_id || null,
    amount: transactionData.amount,
    merchant_name: transactionData.merchant_name || null,
    transaction_date: transactionData.transaction_date || new Date().toISOString(),
    source_type: transactionData.source_type || null,
    reference_number: transactionData.reference_number || null,
    is_manual: transactionData.is_manual || false,
    is_reimbursable: transactionData.is_reimbursable || false,
    receipt_image_path: transactionData.receipt_image_path || null
  };
}

async function updateTransaction(id, userId, updates) {
  const fields = [];
  const values = [];

  if (updates.amount !== undefined) {
    fields.push('amount_encrypted = ?');
    values.push(encryptionService.encrypt(updates.amount.toString()));
  }

  if (updates.merchant_name !== undefined) {
    fields.push('merchant_name_encrypted = ?');
    values.push(
      updates.merchant_name
        ? encryptionService.encrypt(updates.merchant_name)
        : null
    );
  }

  if (updates.category_id !== undefined) {
    fields.push('category_id = ?');
    values.push(updates.category_id || null);
  }

  if (updates.transaction_date !== undefined) {
    fields.push('transaction_date = ?');
    values.push(updates.transaction_date);
  }

  if (updates.source_type !== undefined) {
    fields.push('source_type = ?');
    values.push(updates.source_type || null);
  }

  if (updates.is_manual !== undefined) {
    fields.push('is_manual = ?');
    values.push(updates.is_manual ? 1 : 0);
  }

  if (updates.is_reimbursable !== undefined) {
    fields.push('is_reimbursable = ?');
    values.push(updates.is_reimbursable ? 1 : 0);
  }

  if (updates.receipt_image_path !== undefined) {
    fields.push('receipt_image_path = ?');
    values.push(updates.receipt_image_path || null);
  }

  if (fields.length === 0) {
    return getTransactionById(id, userId);
  }

  values.push(id, userId);

  const result = await db.run(
    `UPDATE Transactions
    SET ${fields.join(', ')}
    WHERE transaction_id = ? AND user_id = ?`,
    values
  );

  if (result.changes === 0) {
    return null;
  }

  return getTransactionById(id, userId);
}

async function deleteTransaction(id, userId) {
  const result = await db.run(
    'DELETE FROM Transactions WHERE transaction_id = ? AND user_id = ?',
    [id, userId]
  );

  return result.changes > 0;
}

module.exports = {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction
};

