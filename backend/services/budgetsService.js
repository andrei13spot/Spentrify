// backend/services/budgetsService.js
// Maps "Budgets" logic to our "Goals" table in SQLite

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

async function getAllBudgets(userId) {
  const sql = `SELECT * FROM Goals WHERE user_id = ? ORDER BY created_at DESC`;
  const rows = await query(sql, [userId]);

  return rows.map(row => ({
    id: row.goal_id,
    // Map back to UI expectations
    description: encryptionService.decrypt(row.goal_name_encrypted),
    amount: parseFloat(encryptionService.decrypt(row.target_amount_encrypted)),
    saved: parseFloat(encryptionService.decrypt(row.saved_amount_encrypted || '0')),
    date: row.deadline,
    status: row.status
  }));
}

// Required placeholders to prevent crashes if controller calls them
async function getBudgetById(id) { return null; }
async function updateBudget(id, userId, data) { return null; }
async function deleteBudget(id, userId) {
    const sql = `DELETE FROM Goals WHERE goal_id = ? AND user_id = ?`;
    const result = await run(sql, [id, userId]);
    return result.changes > 0;
}

module.exports = {
  createBudget,
  getAllBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget
};