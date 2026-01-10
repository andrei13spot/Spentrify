const transactionService = require('../services/transactionsService');

async function getAllTransactions(req, res, next) {
  try {
    // in a real app user_id would come from auth
    const userId = req.query.user_id || 'default_user';
    
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

async function createTransaction(req, res, next) {
  try {
    const { user_id, amount, description, transaction_date } = req.body;
    
    // Input validation
    if (!user_id || amount === undefined || !transaction_date) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required fields: user_id, amount, transaction_date' }
      });
    }
    
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Amount must be a positive number' }
      });
    }
    
    const transaction = await transactionService.createTransaction({
      user_id,
      amount,
      description,
      transaction_date
    });
    
    res.status(201).json({
      success: true,
      data: transaction,
      message: 'Transaction created successfully'
    });
  } catch (error) {
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
    // TODO: Extract user_id from authentication token
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
    // TODO: Extract user_id from authentication token
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
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction
};

