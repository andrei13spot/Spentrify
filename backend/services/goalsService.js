const { query, run } = require('../database/connection');
const encryptionService = require('./encryption');

// GET ALL GOALS
async function getGoals(userId) {
  const sql = `SELECT * FROM SavingsGoals WHERE user_id = ? ORDER BY created_at DESC`;
  const rows = await query(sql, [userId]);

  return rows.map(row => ({
    id: row.goal_id.toString(),
    name: encryptionService.decrypt(row.name_encrypted),
    amount: encryptionService.decrypt(row.target_amount_encrypted),
    currentSavings: encryptionService.decrypt(row.current_amount_encrypted) || '0',
    date: row.deadline_date,
    status: row.status
  }));
}

// CREATE GOAL
async function createGoal(userId, data) {
  const nameEnc = encryptionService.encrypt(data.name);
  const targetEnc = encryptionService.encrypt(data.amount); 
  const currentEnc = encryptionService.encrypt(data.currentSavings || '0'); 

  const sql = `
    INSERT INTO SavingsGoals (
      user_id, name_encrypted, target_amount_encrypted, current_amount_encrypted, deadline_date
    ) VALUES (?, ?, ?, ?, ?)
  `;

  const result = await run(sql, [
    userId, nameEnc, targetEnc, currentEnc, data.date
  ]);

  return { id: result.lastID, ...data };
}

// UPDATE GOAL (Edit / Deposit / Withdraw)
async function updateGoal(goalId, userId, data) {
  const fields = [];
  const values = [];

  if (data.name) {
    fields.push('name_encrypted = ?');
    values.push(encryptionService.encrypt(data.name));
  }
  if (data.amount) {
    fields.push('target_amount_encrypted = ?');
    values.push(encryptionService.encrypt(data.amount));
  }
  if (data.currentSavings !== undefined) {
    fields.push('current_amount_encrypted = ?');
    values.push(encryptionService.encrypt(data.currentSavings.toString()));
  }
  if (data.date) {
    fields.push('deadline_date = ?');
    values.push(data.date);
  }

  if (fields.length === 0) return null;

  values.push(goalId, userId);
  const sql = `UPDATE SavingsGoals SET ${fields.join(', ')} WHERE goal_id = ? AND user_id = ?`;
  
  await run(sql, values);
  return { id: goalId, ...data };
}

// DELETE GOAL
async function deleteGoal(goalId, userId) {
  const sql = `DELETE FROM SavingsGoals WHERE goal_id = ? AND user_id = ?`;
  const result = await run(sql, [goalId, userId]);
  return result.changes > 0;
}

module.exports = { getGoals, createGoal, updateGoal, deleteGoal };