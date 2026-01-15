/**
 * Transactions Controller
 */

const transactionService = require('../services/transactionsService');
const categoriesService = require('../services/categoriesService');
const notificationsService = require('../services/notificationsService');
const { run } = require('../database/connection'); 

/**
 * FEATURE: Transaction Detection
 */
async function detectTransaction(req, res, next) {
  try {
    const { raw_text, user_id } = req.body;

    if (!raw_text) {
      return res.status(400).json({ success: false, error: { message: 'Missing raw_text field' } });
    }

   
    const detectedData = await categoriesService.parseNotification(raw_text, user_id || 1);

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
    const { user_id } = req.query;
    if (!user_id) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    const transactions = await transactionService.getAllTransactions(user_id);
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
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    
    const transaction = await transactionService.getTransactionById(id, user_id);
    
    if (!transaction) {
      return res.status(404).json({ success: false, error: { message: 'Transaction not found' } });
    }
    
    res.json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
}

/**
 * Create Transaction

 */
async function createTransaction(req, res, next) {
  try {
    const { user_id } = req.body; 
    
    // 👇 1. SAFETY NET (THE FIX)

    let finalUserId = Number(user_id);

    if (isNaN(finalUserId)) {
        console.log(`Warning: Invalid user_id received ("${user_id}"). Auto-fixing to ID 1.`);
        finalUserId = 1;
    }

    // Double check kung may ID na
    if (!finalUserId) {
        return res.status(400).json({ success: false, error: 'User ID is required to save transaction.' });
    }

    const catId = req.body.category_id || 13; // Default to 'Others'

    // 2. Ensure User Exists (Gamitin ang finalUserId)
    await run(`INSERT OR IGNORE INTO Users (user_id, email_encrypted, passcode_hash) VALUES (?, 'default_email', 'pass123')`, [finalUserId]);
    
    // 3. Ensure Category Exists
    await run(`INSERT OR IGNORE INTO Categories (category_id, category_name, is_itr_deductible) VALUES (?, 'System Category', 0)`, [catId]);

    // 4. Clean Data
    const cleanData = {
      user_id: finalUserId, 
      category_id: Number(catId),
      amount: Number(req.body.amount),
      merchant_name: req.body.merchant || req.body.merchant_name || 'General Merchant',
      description: req.body.description || req.body.merchant || 'Manual Transaction',
      transaction_date: req.body.transaction_date || new Date().toISOString(),
      source_type: req.body.source_type || 'Digital', 
      reference_number: req.body.reference_number || null,
      is_manual: req.body.is_manual ? 1 : 0,       // Convert true -> 1
      is_reimbursable: req.body.is_reimbursable ? 1 : 0 // Convert true -> 1
    };

    if (typeof cleanData.amount !== 'number' || cleanData.amount <= 0) {
      return res.status(400).json({ success: false, error: { message: 'Amount must be a positive number' } });
    }

    // 5. Save to Database
    const transaction = await transactionService.createTransaction(cleanData);

    console.log(`SUCCESS: Transaction Saved for User ${finalUserId}!`);

    // 6. Trigger Notification
    try {
      const notifTitle = "Transaction Confirmed";
      const notifMessage = `PHP ${cleanData.amount} • ${cleanData.description}`;
      await notificationsService.createNotification(finalUserId, notifTitle, notifMessage);
    } catch (notifError) {
      console.error("Notification Error (Ignored):", notifError);
    }

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
 * Update Transaction
 */
async function updateTransaction(req, res, next) {
  try {
    const { id } = req.params;
    const { amount, description, merchant_name, category_id, transaction_date, is_reimbursable, user_id } = req.body; // user_id in body for updates usually
    
    const finalUserId = user_id || req.query.user_id;

    if (!finalUserId) {
        return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
      return res.status(400).json({ success: false, error: { message: 'Amount must be a positive number' } });
    }
    
    const transaction = await transactionService.updateTransaction(id, finalUserId, {
      amount,
      description,
      merchant_name,
      category_id,
      transaction_date,
      is_reimbursable
    });
    
    if (!transaction) {
      return res.status(404).json({ success: false, error: { message: 'Transaction not found or unauthorized' } });
    }
    
    res.json({ success: true, data: transaction, message: 'Transaction updated successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete Transaction
 */
async function deleteTransaction(req, res, next) {
  try {
    const { id } = req.params;
    const { user_id } = req.body; 

    if (!user_id) {
        return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    
    const deleted = await transactionService.deleteTransaction(id, user_id);
    
    if (!deleted) {
      return res.status(404).json({ success: false, error: { message: 'Transaction not found or unauthorized' } });
    }
    
    res.json({ success: true, message: 'Transaction deleted successfully' });
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