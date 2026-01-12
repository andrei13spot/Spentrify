/**
 * Budgets Controller
 * 
 * Handles HTTP requests for budget operations.
 * Budget amounts are encrypted before database storage.
 */

const budgetService = require('../services/budgetsService');
const notificationsService = require('../services/notificationsService');

/**
 * Get all budgets for a user
 * GET /api/budgets
 */
async function getAllBudgets(req, res, next) {
  try {
    // TODO: Extract user_id from authentication token
    const userId = req.query.user_id || 1;
    
    const budgets = await budgetService.getAllBudgets(userId);
    
    res.json({
      success: true,
      data: budgets,
      count: budgets.length
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single budget by ID
 * GET /api/budgets/:id
 */
async function getBudgetById(req, res, next) {
  try {
    const { id } = req.params;
    // TODO: Extract user_id from authentication token
    const userId = req.query.user_id || 1;
    
    const budget = await budgetService.getBudgetById(id, userId);
    
    if (!budget) {
      return res.status(404).json({
        success: false,
        error: { message: 'Budget not found' }
      });
    }
    
    res.json({
      success: true,
      data: budget
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new budget
 * POST /api/budgets
 * 
 * Request body:
 * {
 *   "user_id": "string",
 *   "category_id": number (optional),
 *   "budget_amount": number,
 *   "period": "daily" | "weekly" | "monthly" | "yearly",
 *   "start_date": "YYYY-MM-DD",
 *   "end_date": "YYYY-MM-DD" (optional)
 * }
 */
async function createBudget(req, res, next) {
  try {
    // Tanggapin ang data galing sa Frontend
    const { user_id, category_id, budget_amount, period, start_date, end_date } = req.body;
    const userId = user_id || 1; 

    // 1. Validation
    if (budget_amount === undefined || !period || !start_date) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing fields: budget_amount, period, or start_date' }
      });
    }
    
    // 2. Save to Database using Service
    const budget = await budgetService.createBudget({
      user_id: userId,
      category_id,
      budget_amount,
      period,
      start_date,
      end_date
    });
    
    res.status(201).json({
      success: true,
      data: budget,
      message: 'Budget created successfully'
    });

    try {
      const notifTitle = "Goal Set"; 
      const notifMessage = `Budget: PHP ${budget_amount} (${period}) • Starts: ${start_date}`;
      
      await notificationsService.createNotification(userId, notifTitle, notifMessage);
      console.log("🔔 Notification created for Budget/Goal");
    } catch (notifError) {
      console.error("Notification Error:", notifError);
    }
    // -------------------------------

    // 4. Send Response back to App
    res.status(201).json({
      success: true,
      data: budget,
      message: 'Budget goal set successfully'
    });

  } catch (error) {
    next(error);
  }
}

/**
 * Update a budget
 * PUT /api/budgets/:id
 */
async function updateBudget(req, res, next) {
  try {
    const { id } = req.params;
    const { budget_amount, period, start_date, end_date, category_id } = req.body;
    // TODO: Extract user_id from authentication token
    const userId = req.query.user_id || 1;
    
    if (budget_amount !== undefined && (typeof budget_amount !== 'number' || budget_amount <= 0)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Budget amount must be a positive number' }
      });
    }
    
    if (period && !['daily', 'weekly', 'monthly', 'yearly'].includes(period)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Period must be one of: daily, weekly, monthly, yearly' }
      });
    }
    
    const budget = await budgetService.updateBudget(id, userId, {
      budget_amount,
      period,
      start_date,
      end_date,
      category_id
    });
    
    if (!budget) {
      return res.status(404).json({
        success: false,
        error: { message: 'Budget not found' }
      });
    }
    
    res.json({
      success: true,
      data: budget,
      message: 'Budget updated successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a budget
 * DELETE /api/budgets/:id
 */
async function deleteBudget(req, res, next) {
  try {
    const { id } = req.params;
    // TODO: Extract user_id from authentication token
    const userId = req.query.user_id || 1;
    
    const deleted = await budgetService.deleteBudget(id, userId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { message: 'Budget not found' }
      });
    }
    
    res.json({
      success: true,
      message: 'Budget deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget
};

