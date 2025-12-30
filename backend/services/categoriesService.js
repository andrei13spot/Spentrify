/**
 * Categories Service
 * 
 * Business logic layer for category operations.
 * Categories are not encrypted as they are not sensitive financial data.
 */

const db = require('../database/connection');

/**
 * Get all categories
 * @returns {Promise<Array>} Array of category objects
 */
async function getAllCategories() {
  const database = await db.getConnection();
  
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM categories ORDER BY name ASC';
    
    database.all(query, [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      resolve(rows);
    });
  });
}

/**
 * Get a single category by ID
 * @param {number} id - Category ID
 * @returns {Promise<Object|null>} Category object or null
 */
async function getCategoryById(id) {
  const database = await db.getConnection();
  
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM categories WHERE id = ?';
    
    database.get(query, [id], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      
      resolve(row || null);
    });
  });
}

/**
 * Create a new category
 * @param {Object} categoryData - Category data
 * @param {string} categoryData.name - Category name
 * @param {string} categoryData.type - Category type ('income' or 'expense')
 * @returns {Promise<Object>} Created category object
 */
async function createCategory(categoryData) {
  const database = await db.getConnection();
  
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO categories (name, type)
      VALUES (?, ?)
    `;
    
    database.run(
      query,
      [categoryData.name, categoryData.type],
      function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        resolve({
          id: this.lastID,
          name: categoryData.name,
          type: categoryData.type,
          created_at: new Date().toISOString()
        });
      }
    );
  });
}

/**
 * Update a category
 * @param {number} id - Category ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated category object or null
 */
async function updateCategory(id, updates) {
  const database = await db.getConnection();
  
  return new Promise((resolve, reject) => {
    const fields = [];
    const values = [];
    
    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    
    if (updates.type !== undefined) {
      fields.push('type = ?');
      values.push(updates.type);
    }
    
    if (fields.length === 0) {
      return getCategoryById(id).then(resolve).catch(reject);
    }
    
    values.push(id);
    
    const query = `
      UPDATE categories
      SET ${fields.join(', ')}
      WHERE id = ?
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
      
      getCategoryById(id).then(resolve).catch(reject);
    });
  });
}

/**
 * Delete a category
 * @param {number} id - Category ID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
async function deleteCategory(id) {
  const database = await db.getConnection();
  
  return new Promise((resolve, reject) => {
    const query = 'DELETE FROM categories WHERE id = ?';
    
    database.run(query, [id], function(err) {
      if (err) {
        reject(err);
        return;
      }
      
      resolve(this.changes > 0);
    });
  });
}

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};

