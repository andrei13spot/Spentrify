// simple service for working with transactions
// this file keeps the encryption logic close to the queries

const db = require('../database/connection');
const encryptionService = require('./encryption');

async function getAllTransactions(userId) {
  const rows = await db.query(
    'SELECT id, user_id, amount_encrypted, description_encrypted, transaction_date, created_at FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC, created_at DESC',
    [userId]
  );

  // basic decryption before sending back to the client
  return rows.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    amount: parseFloat(encryptionService.decrypt(row.amount_encrypted)),
    description: row.description_encrypted
      ? encryptionService.decrypt(row.description_encrypted)
      : null,
    transaction_date: row.transaction_date,
    created_at: row.created_at
  }));
}

async function getTransactionById(id, userId) {
  const rows = await db.query(
    'SELECT id, user_id, amount_encrypted, description_encrypted, transaction_date, created_at FROM transactions WHERE id = ? AND user_id = ? LIMIT 1',
    [id, userId]
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    user_id: row.user_id,
    amount: parseFloat(encryptionService.decrypt(row.amount_encrypted)),
    description: row.description_encrypted
      ? encryptionService.decrypt(row.description_encrypted)
      : null,
    transaction_date: row.transaction_date,
    created_at: row.created_at
  };
}

async function createTransaction(transactionData) {
  // basic encryption before saving
  const amountEncrypted = encryptionService.encrypt(
    transactionData.amount.toString()
  );
  const descriptionEncrypted = transactionData.description
    ? encryptionService.encrypt(transactionData.description)
    : null;

  const result = await db.run(
    'INSERT INTO transactions (user_id, amount_encrypted, description_encrypted, transaction_date) VALUES (?, ?, ?, ?)',
    [
      transactionData.user_id,
      amountEncrypted,
      descriptionEncrypted,
      transactionData.transaction_date
    ]
  );

  // we send back the plain values we received, not what is stored
  // SQLite uses lastID instead of insertId
  return {
    id: result.lastID,
    user_id: transactionData.user_id,
    amount: transactionData.amount,
    description: transactionData.description || null,
    transaction_date: transactionData.transaction_date
  };
}

async function updateTransaction(id, userId, updates) {
  const fields = [];
  const values = [];

  if (updates.amount !== undefined) {
    fields.push('amount_encrypted = ?');
    values.push(encryptionService.encrypt(updates.amount.toString()));
  }

  if (updates.description !== undefined) {
    fields.push('description_encrypted = ?');
    values.push(
      updates.description
        ? encryptionService.encrypt(updates.description)
        : null
    );
  }

  if (updates.transaction_date !== undefined) {
    fields.push('transaction_date = ?');
    values.push(updates.transaction_date);
  }

  if (fields.length === 0) {
    return getTransactionById(id, userId);
  }

  values.push(id, userId);

  const sql = `
    UPDATE transactions
    SET ${fields.join(', ')}
    WHERE id = ? AND user_id = ?
  `;

  const result = await db.run(sql, values);

  // SQLite uses changes instead of affectedRows
  if (result.changes === 0) {
    return null;
  }

  return getTransactionById(id, userId);
}

async function deleteTransaction(id, userId) {
  const result = await db.run(
    'DELETE FROM transactions WHERE id = ? AND user_id = ?',
    [id, userId]
  );

  // SQLite uses changes instead of affectedRows
  return result.changes > 0;
}

module.exports = {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction
};

