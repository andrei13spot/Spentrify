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
 * Ito ang magsisilbing basehan para sa "One-Tap" selection.
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
 * Nag-usuggest ng category_id base sa merchant name.
 * Ginagamit para sa "Instant Categorization Pop-Up" (Feature 2).
 * @param {string} merchantName 
 * @returns {Promise<number|null>}
 */
async function suggestCategory(merchantName) {
  if (!merchantName) return null;
  
  const name = merchantName.toLowerCase();
  const matchedKey = Object.keys(KEYWORD_MAP).find(key => name.includes(key));
  
  if (matchedKey) {
    const categoryName = KEYWORD_MAP[matchedKey];
    // Gagamitin ang Categories table na nasa connection.js niyo
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
 */
async function getAllCategories() {
  // Gumagamit ng Category_name dahil ito ang nasa connection.js mo
  return await db.query('SELECT * FROM Categories ORDER BY category_name ASC');
}

async function getCategoryById(id) {
  const rows = await db.query('SELECT * FROM Categories WHERE category_id = ?', [id]);
  return rows[0] || null;
}

async function createCategory(categoryData) {
  const result = await db.run(
    'INSERT INTO Categories (category_name, is_itr_deductible) VALUES (?, ?)',
    [categoryData.name, categoryData.is_itr_deductible || 0]
  );
  
  return {
    category_id: result.lastID,
    ...categoryData,
    created_at: new Date().toISOString()
  };
}

async function updateCategory(id, updates) {
  const fields = [];
  const values = [];
  
  if (updates.name !== undefined) {
    fields.push('category_name = ?');
    values.push(updates.name);
  }
  
  if (updates.is_itr_deductible !== undefined) {
    fields.push('is_itr_deductible = ?');
    values.push(updates.is_itr_deductible);
  }
  
  if (fields.length === 0) return await getCategoryById(id);
  
  values.push(id);
  const sql = `UPDATE Categories SET ${fields.join(', ')} WHERE category_id = ?`;
  
  const result = await db.run(sql, values);
  return result.changes > 0 ? await getCategoryById(id) : null;
}

async function deleteCategory(id) {
  const result = await db.run('DELETE FROM Categories WHERE category_id = ?', [id]);
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

