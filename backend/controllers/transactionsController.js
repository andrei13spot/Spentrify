/**
 * Transactions Controller
 * * Handles HTTP requests for transaction operations.
 * Includes logic for:
 * 1. Transaction Detection (SMS Parsing for Pop-up)
 * 2. CRUD Operations (Create, Read, Update, Delete)
 */

const transactionService = require('../services/transactionsService');
const categoriesService = require('../services/categoriesService');
const { parseNotification } = require('../services/categoriesService');

/**
 * FEATURE: Transaction Detection
 * POST /api/transactions/detect
 * * Tinatawag ng Mobile App Listener kapag may na-receive na SMS/Notification.
 * Returns parsed data (amount, merchant, suggested category) para sa Pop-up UI.
 */
async function detectTransaction(req, res, next) {
  try {
    const { raw_text, user_id } = req.body;

    if (!raw_text) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'Missing raw_text field' } 
      });
    }

    // 1. I-parse ang text gamit ang Parser Service
    const detectedData = await categoriesService.parseNotification(raw_text, user_id || 'default_user');

    // 2. I-return ang data sa frontend para ipakita sa "New Transaction Pop Up Page"
    // Note: Hindi pa ito sine-save sa database. Hinihintay nito ang 'Confirm' tap ng user.
    res.json({
      success: true,
      data: detectedData,
      message: 'Transaction detected successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all transactions
 * GET /api/transactions
 */
async function getAllTransactions(req, res, next) {
  try {
    const userId = 1;
    
    const transactions = await transactionService.getAllTransactions(userId);
    
    res.json({
      success: true,
      data: transactions,
      count: transactions.length
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single transaction by ID
 * GET /api/transactions/:id
 */
async function getTransactionById(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.query.user_id || 'default_user';
    
    const transaction = await transactionService.getTransactionById(id, userId);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: { message: 'Transaction not found' }
      });
    }
    
    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new transaction (Used by "Confirm" button in Pop-up & Manual Add)
 * POST /api/transactions
 */
/**
 * Create Transaction (Manual / Pop-up Confirm)
 */
async function createTransaction(req, res, next) {
  try {
    // 1. Kunin ang database helpers (run lang ang kailangan natin dito)
    const { run } = require('../database/connection');
    
    // Pansamantala, User ID 1 muna habang wala pang Login page
    const userId = 1; 
    const catId = req.body.category_id || 1;

    await run(`INSERT OR IGNORE INTO Users (user_id, email_encrypted) VALUES (1, 'default_user_enc')`);
    await run(`INSERT OR IGNORE INTO Categories (category_id, category_name) VALUES (?, ?)`, [catId, 'General']);

 
    const cleanData = {
      user_id: userId,
      category_id: catId,
      amount: req.body.amount,
      merchant_name: req.body.merchant || req.body.merchant_name || 'General Merchant',
      description: req.body.description || req.body.merchant || 'Manual Transaction',
      transaction_date: req.body.transaction_date || new Date().toISOString(),
      source_type: req.body.source_type || 'Digital', 
      reference_number: req.body.reference_number || null,
      is_manual: req.body.is_manual || 0
    };

    // 4. Tawagin ang service para sa encryption at actual saving
    const transactionService = require('../services/transactionsService');
    const transaction = await transactionService.createTransaction(cleanData);

    console.log("SUCCESS: Transaction Saved!");
    console.log("Amount:", cleanData.amount);
    console.log("Merchant:", cleanData.merchant_name);

    res.status(201).json({
      success: true,
      data: transaction,
      message: 'Transaction saved successfully!'
    });

  } catch (error) {
    console.error("SAVE ERROR:", error);
    next(error);
  }
}

/**
 * Update an existing transaction
 * PUT /api/transactions/:id
 */
async function updateTransaction(req, res, next) {
  try {
    const { id } = req.params;
    const { amount, description, category_id, transaction_date } = req.body;
    const userId = req.query.user_id || 'default_user';
    
    // Input validation
    if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Amount must be a positive number' }
      });
    }
    
    const transaction = await transactionService.updateTransaction(id, userId, {
      amount,
      description,
      category_id,
      transaction_date
    });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: { message: 'Transaction not found' }
      });
    }
    
    res.json({
      success: true,
      data: transaction,
      message: 'Transaction updated successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a transaction
 * DELETE /api/transactions/:id
 */
async function deleteTransaction(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.query.user_id || 'default_user';
    
    const deleted = await transactionService.deleteTransaction(id, userId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { message: 'Transaction not found' }
      });
    }
    
    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  detectTransaction, // ADDED: Export the new endpoint
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  parseNotification
};