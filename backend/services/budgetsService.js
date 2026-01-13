/**
 * Budgets Service
 * 
 * Business logic layer for budget operations.
 * Budget amounts are encrypted before database storage.
 */

const { query, run } = require('../database/connection');
const encryptionService = require('./encryption');

async function createBudget(data) {
  // 1. Map Budget Fields to Goals Table Columns
  // Budget Amount -> Target Amount
  // Description -> Goal Name
  const targetEnc = encryptionService.encrypt(data.budget_amount.toString());
  const nameEnc = data.description 
    ? encryptionService.encrypt(data.description) 
    : encryptionService.encrypt('New Goal');
  
  // Default saved amount to 0
  const savedEnc = encryptionService.encrypt('0');

  const sql = `
    INSERT INTO Goals (user_id, goal_name_encrypted, target_amount_encrypted, saved_amount_encrypted, deadline, status)
    VALUES (?, ?, ?, ?, ?, 'Active')
  `;

  // We use start_date as deadline for now, or null
  const result = await run(sql, [
    data.user_id,
    nameEnc,
    targetEnc,
    savedEnc,
    data.start_date || new Date().toISOString()
  ]);

  return { 
    id: result.lastID, 
    ...data 
  };
}

/**
 * Get all budgets for a user
 * @param {string} userId - User identifier
 * @returns {Promise<Array>} Array of decrypted budget objects
 */
async function getAllBudgets(userId) {
  const rows = await query(
    `SELECT 
      budget_id,
      user_id,
      category_id,
      target_amount_encrypted,
      period,
      start_date,
      end_date,
      created_at,
      updated_at
    FROM Budgets
    WHERE user_id = ?
    ORDER BY start_date DESC, created_at DESC`,
    [userId]
  );
  
  // Decrypt budget amounts
  return rows.map(row => ({
    budget_id: row.budget_id,
    user_id: row.user_id,
    category_id: row.category_id,
    target_amount: parseFloat(encryptionService.decrypt(row.target_amount_encrypted)),
    period: row.period,
    start_date: row.start_date,
    end_date: row.end_date,
    created_at: row.created_at,
    updated_at: row.updated_at
  }));
}

// Required placeholders to prevent crashes if controller calls them
/**
 * Get a single budget by ID
 * @param {number} id - Budget ID
 * @param {string} userId - User identifier (for authorization)
 * @returns {Promise<Object|null>} Decrypted budget object or null
 */
async function getBudgetById(id, userId) {
  const rows = await query(
    `SELECT 
      budget_id,
      user_id,
      category_id,
      target_amount_encrypted,
      period,
      start_date,
      end_date,
      created_at,
      updated_at
    FROM Budgets
    WHERE budget_id = ? AND user_id = ?
    LIMIT 1`,
    [id, userId]
  );
  
  if (rows.length === 0) {
    return null;
  }
  
  const row = rows[0];
  return {
    budget_id: row.budget_id,
    user_id: row.user_id,
    category_id: row.category_id,
    target_amount: parseFloat(encryptionService.decrypt(row.target_amount_encrypted)),
    period: row.period,
    start_date: row.start_date,
    end_date: row.end_date,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

/**
 * Update a budget
 * @param {number} id - Budget ID
 * @param {string} userId - User identifier (for authorization)
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated budget with decrypted fields or null
 */
async function updateBudget(id, userId, updates) {
  const fields = [];
  const values = [];
  
  if (updates.target_amount !== undefined) {
    fields.push('target_amount_encrypted = ?');
    values.push(encryptionService.encrypt(updates.target_amount.toString()));
  }
  
  if (updates.period !== undefined) {
    fields.push('period = ?');
    values.push(updates.period);
  }
  
  if (updates.start_date !== undefined) {
    fields.push('start_date = ?');
    values.push(updates.start_date);
  }
  
  if (updates.end_date !== undefined) {
    fields.push('end_date = ?');
    values.push(updates.end_date || null);
  }
  
  if (updates.category_id !== undefined) {
    fields.push('category_id = ?');
    values.push(updates.category_id || null);
  }
  
  if (fields.length === 0) {
    return getBudgetById(id, userId);
  }
  
  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id, userId);
  
  const result = await run(
    `UPDATE Budgets
    SET ${fields.join(', ')}
    WHERE budget_id = ? AND user_id = ?`,
    values
  );
  
  if (result.changes === 0) {
    return null;
  }
  
  return getBudgetById(id, userId);
}
/**
 * Delete a budget
 * @param {number} id - Budget ID
 * @param {string} userId - User identifier (for authorization)
 * @returns {Promise<boolean>} True if deleted, false if not found
 */

async function deleteBudget(id, userId) {
    const result = await run(
    'DELETE FROM Budgets WHERE budget_id = ? AND user_id = ?',
    [id, userId]
  );
  
  return result.changes > 0;
}

module.exports = {
  createBudget,
  getAllBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget
};