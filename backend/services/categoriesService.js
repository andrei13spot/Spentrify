/**
 * Categories Service
 * 
 * Business logic layer for category operations.
 * Categories are not encrypted as they are not sensitive financial data.
 */

const db = require('../database/connection');

/**
 * FEATURE: Categorization Logic
 * Mapping ng keywords base sa Merchant name mula sa SMS/Notifications.
 */
const KEYWORD_MAP = {
  'Food': ['jollibee', 'mcdonalds', 'grabfood', 'foodpanda', 'starbucks', 'kfc', 'burger king'],
  'Groceries': ['puregold', 'savemore', 'supermarket', '7-eleven', 'mercury drug', 'watsons'],
  'Transportation': ['grab', 'angkas', 'joyride', 'shell', 'petron', 'caltex', 'easytrip', 'autosweep'],
  'Electricity': ['meralco', 'kuryente'],
  'Water': ['maynilad', 'manila water'],
  'Internet': ['globe', 'smart', 'pldt', 'converge', 'skycable'],
  'Subscriptions': ['netflix', 'spotify', 'youtube', 'disney'],
  'Shopping': ['lazada', 'shopee', 'zalora', 'uniqlo', 'sm store']
};

/**
 * @param {string} merchantName 
 * @returns {Promise<number|null>}
 */
async function suggestCategory(merchantName) {
  if (!merchantName) return null;
  
  const name = merchantName.toLowerCase();
  const matchedKey = Object.keys(KEYWORD_MAP).find(key => name.includes(key));
  
  if (matchedKey) {
    const categoryName = KEYWORD_MAP[matchedKey];
    const rows = await db.query(
      'SELECT category_id FROM Categories WHERE category_name = ? LIMIT 1',
      [categoryName]
    );
    return rows.length > 0 ? rows[0].category_id : null;
  }
  
  return null; // Default to 'Others' sa UI kung walang match
}

/**
 * FEATURE: SMS/Notification Parsing
 * Hinihimay ang raw text mula sa Android Emulator (Feature 1).
 * @param {string} rawText 
 * @param {number} userId 
 */
async function parseNotification(rawText, userId) {
  // Regex patterns para sa digital transactions (GCash/Maya)
  const PATTERNS = {
    GCASH: /You have sent PHP\s?(\d+\.?\d*) to (.*) on/i,
    MAYA: /You've paid PHP\s?(\d+\.?\d*) to (.*)\./i
  };

  let amount = 0;
  let merchant = 'Unknown Merchant';

  const gcashMatch = rawText.match(PATTERNS.GCASH);
  if (gcashMatch) {
    amount = parseFloat(gcashMatch[1]);
    merchant = gcashMatch[2].trim();
  }

  const categoryId = await suggestCategory(merchant);

  return {
    user_id: userId,
    amount: amount,
    merchant_name: merchant,
    transaction_date: new Date().toISOString(),
    category_id: categoryId,
    is_manual: 0
  };
}

/**
 * STANDARD OPERATIONS
 * Get all categories
 * @returns {Promise<Array>} Array of category objects
 */

async function getAllCategories() {
  const rows = await db.query(
    'SELECT category_id, category_name, is_itr_deductible, icon_identifier, created_at FROM Categories ORDER BY category_name ASC',
    []
  );
  return rows.map(row => ({
    category_id: row.category_id,
    category_name: row.category_name,
    is_itr_deductible: row.is_itr_deductible === 1,
    icon_identifier: row.icon_identifier,
    created_at: row.created_at
  }));
}
/*
 * Get a single category by ID
 * @param {number} id - Category ID
 * @returns {Promise<Object|null>} Category object or null
*/

async function getCategoryById(id) {
  const rows = await db.query(
    'SELECT category_id, category_name, is_itr_deductible, icon_identifier, created_at FROM Categories WHERE category_id = ? LIMIT 1',
    [id]
  );
  
  if (rows.length === 0) {
    return null;
}

  const row = rows[0];
  return {
    category_id: row.category_id,
    category_name: row.category_name,
    is_itr_deductible: row.is_itr_deductible === 1,
    icon_identifier: row.icon_identifier,
    created_at: row.created_at
  };
}
/*
 * Create a new category
 * @param {Object} categoryData - Category data
 * @param {string} categoryData.category_name - Category name
 * @param {boolean} categoryData.is_itr_deductible - Whether category is ITR deductible
 * @param {string} categoryData.icon_identifier - Icon identifier (optional)
 * @returns {Promise<Object>} Created category object
*/

async function createCategory(categoryData) {
  const result = await db.run(
    `INSERT INTO Categories (category_name, is_itr_deductible, icon_identifier)
    VALUES (?, ?, ?)`,
    [
      categoryData.category_name,
      categoryData.is_itr_deductible ? 1 : 0,
      categoryData.icon_identifier || null
    ]
  );
  
  return {
    category_id: result.lastID,
    category_name: categoryData.category_name,
    is_itr_deductible: categoryData.is_itr_deductible,
    icon_identifier: categoryData.icon_identifier || null,
    created_at: new Date().toISOString()
  };
}
/**
 * Update a category
 * @param {number} id - Category ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated category object or null
 */

async function updateCategory(id, updates) {
  const fields = [];
  const values = [];
  
  if (updates.category_name !== undefined) {
    fields.push('category_name = ?');
    values.push(updates.category_name);
  }
  
  if (updates.is_itr_deductible !== undefined) {
    fields.push('is_itr_deductible = ?');
    values.push(updates.is_itr_deductible ? 1 : 0);
  }

    if (updates.icon_identifier !== undefined) {
    fields.push('icon_identifier = ?');
    values.push(updates.icon_identifier || null);
  }
  
  if (fields.length === 0) {
    return getCategoryById(id);
  }
  
  values.push(id);
  const result = await db.run(
    `UPDATE Categories
    SET ${fields.join(', ')}
    WHERE category_id = ?`,
    values
  );
  
  if (result.changes === 0) {
    return null;
  }
  
  return getCategoryById(id);
}

/**
 * Delete a category
 * @param {number} id - Category ID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */

async function deleteCategory(id) {
  const result = await db.run(
    'DELETE FROM Categories WHERE category_id = ?',
    [id]
  );
  return result.changes > 0;
}

module.exports = {
  parseNotification,
  suggestCategory,
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};

