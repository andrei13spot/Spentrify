/**
 * Budgets Service
 * 
 * Business logic layer for budget operations.
 * Budget amounts are encrypted before database storage.
 */

const db = require('../database/connection');
const encryptionService = require('./encryption');

/**
 * Get all budgets for a user
 * @param {string} userId - User identifier
 * @returns {Promise<Array>} Array of decrypted budget objects
 */
async function getAllBudgets(userId) {
  const database = await db.getConnection();
  
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        id,
        user_id,
        category_id,
        budget_amount_encrypted,
        period,
        start_date,
        end_date,
        created_at,
        updated_at
      FROM budgets
      WHERE user_id = ?
      ORDER BY start_date DESC, created_at DESC
    `;
    
    database.all(query, [userId], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Decrypt budget amounts
      const budgets = rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        category_id: row.category_id,
        budget_amount: parseFloat(encryptionService.decrypt(row.budget_amount_encrypted)),
        period: row.period,
        start_date: row.start_date,
        end_date: row.end_date,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
      
      resolve(budgets);
    });
  });
}

/**
 * Get a single budget by ID
 * @param {number} id - Budget ID
 * @param {string} userId - User identifier (for authorization)
 * @returns {Promise<Object|null>} Decrypted budget object or null
 */
async function getBudgetById(id, userId) {
  const database = await db.getConnection();
  
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        id,
        user_id,
        category_id,
        budget_amount_encrypted,
        period,
        start_date,
        end_date,
        created_at,
        updated_at
      FROM budgets
      WHERE id = ? AND user_id = ?
    `;
    
    database.get(query, [id, userId], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!row) {
        resolve(null);
        return;
      }
      
      const budget = {
        id: row.id,
        user_id: row.user_id,
        category_id: row.category_id,
        budget_amount: parseFloat(encryptionService.decrypt(row.budget_amount_encrypted)),
        period: row.period,
        start_date: row.start_date,
        end_date: row.end_date,
        created_at: row.created_at,
        updated_at: row.updated_at
      };
      
      resolve(budget);
    });
  });
}

/**
 * Create a new budget
 * @param {Object} budgetData - Budget data
 * @param {string} budgetData.user_id - User identifier
 * @param {number} budgetData.budget_amount - Budget amount (will be encrypted)
 * @param {string} budgetData.period - Budget period
 * @param {string} budgetData.start_date - Start date
 * @param {string} budgetData.end_date - End date (optional)
 * @param {number} budgetData.category_id - Category ID (optional)
 * @returns {Promise<Object>} Created budget with decrypted fields
 */
async function createBudget(budgetData) {
  const database = await db.getConnection();
  
  return new Promise((resolve, reject) => {
    // Encrypt budget amount before database insertion
    const budgetAmountEncrypted = encryptionService.encrypt(budgetData.budget_amount.toString());
    
    const query = `
      INSERT INTO budgets (
        user_id,
        category_id,
        budget_amount_encrypted,
        period,
        start_date,
        end_date
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    database.run(
      query,
      [
        budgetData.user_id,
        budgetData.category_id || null,
        budgetAmountEncrypted,
        budgetData.period,
        budgetData.start_date,
        budgetData.end_date || null
      ],
      function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        resolve({
          id: this.lastID,
          user_id: budgetData.user_id,
          category_id: budgetData.category_id || null,
          budget_amount: budgetData.budget_amount,
          period: budgetData.period,
          start_date: budgetData.start_date,
          end_date: budgetData.end_date || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    );
  });
}

/**
 * Update a budget
 * @param {number} id - Budget ID
 * @param {string} userId - User identifier (for authorization)
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated budget with decrypted fields or null
 */
async function updateBudget(id, userId, updates) {
  const database = await db.getConnection();
  
  return new Promise((resolve, reject) => {
    const fields = [];
    const values = [];
    
    if (updates.budget_amount !== undefined) {
      fields.push('budget_amount_encrypted = ?');
      values.push(encryptionService.encrypt(updates.budget_amount.toString()));
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
      return getBudgetById(id, userId).then(resolve).catch(reject);
    }
    
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id, userId);
    
    const query = `
      UPDATE budgets
      SET ${fields.join(', ')}
      WHERE id = ? AND user_id = ?
    `;
    
    database.run(query, values, function(err) {
      if (err) {
        reject(err);
        return;
      }
      
      if (this.changes === 0) {
        resolve(null);
        return;
      }
      
      getBudgetById(id, userId).then(resolve).catch(reject);
    });
  });
}

/**
 * Delete a budget
 * @param {number} id - Budget ID
 * @param {string} userId - User identifier (for authorization)
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
async function deleteBudget(id, userId) {
  const database = await db.getConnection();
  
  return new Promise((resolve, reject) => {
    const query = 'DELETE FROM budgets WHERE id = ? AND user_id = ?';
    
    database.run(query, [id, userId], function(err) {
      if (err) {
        reject(err);
        return;
      }
      
      resolve(this.changes > 0);
    });
  });
}

module.exports = {
  getAllBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget
};

