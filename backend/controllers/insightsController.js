/**
 * Insights Controller
 * 
 * Handles HTTP requests for AI insights and recommendations.
 */

const aiInsightsService = require('../services/aiInsightsService');

/**
 * Generate insights for a user
 * POST /api/insights/generate
 */
async function generateInsights(req, res, next) {
  try {
    const userId = req.query.user_id || req.body.user_id || 1;
    
    const insights = await aiInsightsService.generateInsights(userId);
    
    res.json({
      success: true,
      data: insights,
      message: `Generated ${insights.length} insights`
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get unread insights for a user
 * GET /api/insights
 */
async function getInsights(req, res, next) {
  try {
    const userId = req.query.user_id || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const insights = await aiInsightsService.getUnreadInsights(userId, limit);
    
    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark insight as read
 * PUT /api/insights/:id/read
 */
async function markAsRead(req, res, next) {
  try {
    const userId = req.query.user_id || req.body.user_id || 1;
    const insightId = parseInt(req.params.id);
    
    await aiInsightsService.markAsRead(userId, insightId);
    
    res.json({
      success: true,
      message: 'Insight marked as read'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  generateInsights,
  getInsights,
  markAsRead
};
