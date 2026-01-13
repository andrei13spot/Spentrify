
const { query, run } = require('../database/connection');
const encryptionService = require('./encryption');

/**
 * GET ALL TRANSACTIONS
 * - Joins with Categories table para makuha ang name at icon
 * - Decrypts amount, merchant, and description
 */
async function getAllTransactions(userId) {
  // JOIN: Kinukuha natin ang category_name mula sa Categories table gamit ang category_id
  const sql = `
    SELECT 
      t.transaction_id, 
      t.user_id, 
      t.amount_encrypted, 
      t.merchant_name_encrypted, 
      t.description_encrypted, 
      t.transaction_date, 
      t.source_type,
      t.is_manual,
      t.category_id,
      c.category_name,
      c.icon_identifier
    FROM Transactions t
    LEFT JOIN Categories c ON t.category_id = c.category_id
    WHERE t.user_id = ? 
    ORDER BY t.transaction_date DESC, t.created_at DESC
  `;

  const rows = await query(sql, [userId]);

  // Decryption & Formatting
  return rows.map((row) => ({
    id: row.transaction_id, // Map DB 'transaction_id' to Frontend 'id'
    user_id: row.user_id,
    amount: parseFloat(encryptionService.decrypt(row.amount_encrypted)),
    merchant_name: row.merchant_name_encrypted 
      ? encryptionService.decrypt(row.merchant_name_encrypted) 
      : 'Unknown Merchant',
    description: row.description_encrypted
      ? encryptionService.decrypt(row.description_encrypted)
      : null,
    category: row.category_name || 'Others', // Fallback name
    category_id: row.category_id,
    icon: row.icon_identifier,
    transaction_date: row.transaction_date,
    source_type: row.source_type,
    is_manual: row.is_manual
  }));
}

/**
 * GET SINGLE TRANSACTION
 */
async function getTransactionById(id, userId) {
  const sql = `
    SELECT 
      t.*, 
      c.category_name, 
      c.icon_identifier
    FROM Transactions t
    LEFT JOIN Categories c ON t.category_id = c.category_id
    WHERE t.transaction_id = ? AND t.user_id = ? 
    LIMIT 1
  `;

  const rows = await query(sql, [id, userId]);

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.transaction_id,
    user_id: row.user_id,
    amount: parseFloat(encryptionService.decrypt(row.amount_encrypted)),
    merchant_name: row.merchant_name_encrypted 
      ? encryptionService.decrypt(row.merchant_name_encrypted) 
      : null,
    description: row.description_encrypted
      ? encryptionService.decrypt(row.description_encrypted)
      : null,
    category: row.category_name,
    category_id: row.category_id,
    transaction_date: row.transaction_date,
    source_type: row.source_type,
    is_manual: row.is_manual
  };
}

/**
 * CREATE TRANSACTION
 * - Handles encryption of sensitive fields
 * - Saves merchant_name and category_id
 */
async function createTransaction(transactionData) {
  // 1. Encrypt Data
  const amountEncrypted = encryptionService.encrypt(
    transactionData.amount.toString()
  );
  
  const merchantEncrypted = transactionData.merchant_name
    ? encryptionService.encrypt(transactionData.merchant_name)
    : null;

  const descriptionEncrypted = transactionData.description
    ? encryptionService.encrypt(transactionData.description)
    : null;

  // 2. Insert into DB
  const sql = `
    INSERT INTO Transactions (
      user_id, 
      category_id, 
      amount_encrypted, 
      merchant_name_encrypted, 
      description_encrypted, 
      transaction_date,
      source_type,
      reference_number,
      is_manual
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const result = await run(sql, [
      transactionData.user_id,
      transactionData.category_id || 13, // Default to Others (13) if missing
      amountEncrypted,
      merchantEncrypted,
      descriptionEncrypted,
      transactionData.transaction_date,
      transactionData.source_type || 'Digital',
      transactionData.reference_number || null,
      transactionData.is_manual || 0
    ]
  );

  // 3. Return plain object (for Frontend confirmation)
  return {
    id: result.lastID,
    user_id: transactionData.user_id,
    amount: transactionData.amount,
    merchant_name: transactionData.merchant_name,
    description: transactionData.description || null,
    category_id: transactionData.category_id,
    transaction_date: transactionData.transaction_date
  };
}

/**
 * UPDATE TRANSACTION
 */
async function updateTransaction(id, userId, updates) {
  const fields = [];
  const values = [];

  // Build dynamic query based on what fields are present
  if (updates.amount !== undefined) {
    fields.push('amount_encrypted = ?');
    values.push(encryptionService.encrypt(updates.amount.toString()));
  }

  if (updates.merchant_name !== undefined) {
    fields.push('merchant_name_encrypted = ?');
    values.push(encryptionService.encrypt(updates.merchant_name));
  }

  if (updates.description !== undefined) {
    fields.push('description_encrypted = ?');
    values.push(
      updates.description
        ? encryptionService.encrypt(updates.description)
        : null
    );
  }

  if (updates.category_id !== undefined) {
    fields.push('category_id = ?');
    values.push(updates.category_id);
  }

  if (updates.transaction_date !== undefined) {
    fields.push('transaction_date = ?');
    values.push(updates.transaction_date);
  }

  if (fields.length === 0) {
    return getTransactionById(id, userId);
  }

  values.push(id, userId);

  // Note: Using 'transaction_id' column name
  const sql = `
    UPDATE Transactions
    SET ${fields.join(', ')}
    WHERE transaction_id = ? AND user_id = ?
  `;

  const result = await run(sql, values);

  if (result.changes === 0) {
    return null;
  }

  return getTransactionById(id, userId);
}

/**
 * DELETE TRANSACTION
 */
async function deleteTransaction(id, userId) {
  const result = await run(
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