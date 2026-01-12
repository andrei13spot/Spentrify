/**
 * Transactions Controller
 * Handles HTTP requests for transaction operations.
 */

const transactionService = require('../services/transactionsService');
const categoriesService = require('../services/categoriesService');
const notificationsService = require('../services/notificationsService');
// Import database helper directly for the fix
const { run } = require('../database/connection'); 

/**
 * FEATURE: Transaction Detection
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

    const detectedData = await categoriesService.parseNotification(raw_text, user_id || 'default_user');

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
 * Create Transaction (Manual / Pop-up Confirm)
 * FIXED: Auto-creates User & Category to prevent DB Crashes
 */
async function createTransaction(req, res, next) {
  try {
    // 1. Setup Defaults
    const userId = 1; // Force User 1 for now
    const catId = req.body.category_id || 13; // Default to 'Others' (13) if null

    // 2. --- SAFETY CHECK (THE FIX) ---
    // Ensure User 1 exists in DB
    await run(`INSERT OR IGNORE INTO Users (user_id, email_encrypted, passcode_hash) VALUES (1, 'default_user_enc', 'pass123')`);
    
    // Ensure the chosen Category exists in DB (Avoids Foreign Key Error)
    // We insert a generic placeholder if it doesn't exist yet
    await run(`INSERT OR IGNORE INTO Categories (category_id, category_name, is_itr_deductible) VALUES (?, 'System Category', 0)`, [catId]);
    // -----------------------------

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

    // 3. Save Transaction
    const transaction = await transactionService.createTransaction(cleanData);

    console.log("SUCCESS: Transaction Saved!");
    console.log("Amount:", cleanData.amount);

    // 4. Trigger Notification (Fire and Forget)
    try {
      const notifTitle = "Transaction Confirmed";
      const notifMessage = `PHP ${cleanData.amount} • ${req.body.description || 'Expense'}`;
      
      await notificationsService.createNotification(userId, notifTitle, notifMessage);
      console.log("Notification created");
    } catch (notifError) {
      console.error("Notification Error (Ignored):", notifError);
    }

    // 5. Send Response
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
 */
async function updateTransaction(req, res, next) {
  try {
    const { id } = req.params;
    const { amount, description, category_id, transaction_date } = req.body;
    const userId = req.query.user_id || 1;
    
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
  detectTransaction,
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction
};