/**
 * Analytics Controller
 * 
 * Handles HTTP requests for spending analytics and insights.
 * Analytics data may be cached for offline-first support.
 */

const analyticsService = require('../services/analyticsService');

/**
 * Get spending analytics for a user
 * GET /api/analytics
 * 
 * Query parameters:
 * - user_id: User identifier
 * - period: Time period (optional, e.g., "2024-01")
 * - category_id: Filter by category (optional)
 */
async function getAnalytics(req, res, next) {
  try {
    // TODO: Extract user_id from authentication token
    const userId = req.query.user_id || 'default_user';
    const period = req.query.period;
    const categoryId = req.query.category_id ? parseInt(req.query.category_id) : undefined;
    
    const analytics = await analyticsService.getSpendingAnalytics(userId, {
      period,
      categoryId
    });
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get spending summary
 * GET /api/analytics/summary
 */
async function getSummary(req, res, next) {
  try {
    // TODO: Extract user_id from authentication token
    const userId = req.query.user_id || 'default_user';
    const period = req.query.period;
    
    const summary = await analyticsService.getSpendingSummary(userId, period);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get category-wise spending breakdown
 * GET /api/analytics/by-category
 */
async function getByCategory(req, res, next) {
  try {
    // TODO: Extract user_id from authentication token
    const userId = req.query.user_id || 'default_user';
    const period = req.query.period;
    
    const breakdown = await analyticsService.getSpendingByCategory(userId, period);
    
    res.json({
      success: true,
      data: breakdown
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAnalytics,
  getSummary,
  getByCategory
};

