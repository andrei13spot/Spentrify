/**
 * Insights Controller
 * 
 * Handles HTTP requests for AI insights and recommendations.
 */

const aiInsightsService = require('../services/aiInsightsService');
const geminiService = require('../services/geminiService');

/**
 * Generate insights for a user
 * POST /api/insights/generate
 */
async function generateInsights(req, res, next) {
  try {
    const userId = Number(req.query.user_id || req.body.user_id);
    const mode = req.query.mode || req.body.mode;
    if (Number.isNaN(userId)) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    
    const insights = await aiInsightsService.generateInsights(userId, mode);
    
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
    const userId = Number(req.query.user_id);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
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
    const userId = Number(req.query.user_id || req.body.user_id);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
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

/**
 * Get insight detail (Gemini-generated action points)
 * POST /api/insights/detail
 */
async function getInsightDetail(req, res, next) {
  try {
    const userId = Number(req.body.user_id);
    const insightId = req.body.insight_id ? Number(req.body.insight_id) : null;
    const insightType = req.body.insight_type || 'Custom';
    const insightMessage = req.body.insight_message || '';
    const context = req.body.context || {};

    if (Number.isNaN(userId)) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    let insight = null;
    if (insightId && !Number.isNaN(insightId)) {
      insight = await aiInsightsService.getInsightById(userId, insightId);
      if (!insight) {
        return res.status(404).json({ success: false, error: 'Insight not found' });
      }
    }

    const detail = await geminiService.generateInsightDetail({
      userId,
      insightType: insight?.type || insightType,
      insightMessage: insight?.message || insightMessage,
      context,
    });

    if (!detail) {
      return res.json({
        success: true,
        data: {
          summary: insight?.message || insightMessage || 'No summary available.',
          actionPoints: [],
          recommendations: [],
        },
      });
    }

    res.json({
      success: true,
      data: detail,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  generateInsights,
  getInsights,
  markAsRead,
  getInsightDetail
};
