/**
 * Analytics Routes
 * 
 * Defines REST endpoints for spending analytics.
 */

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// GET /api/analytics - Get full analytics
router.get('/', analyticsController.getAnalytics);

// GET /api/analytics/summary - Get spending summary
router.get('/summary', analyticsController.getSummary);

// GET /api/analytics/by-category - Get category breakdown
router.get('/by-category', analyticsController.getByCategory);

// GET /api/analytics/weekly-trend - Get weekly spending trend
router.get('/weekly-trend', async (req, res, next) => {
  try {
    const analyticsService = require('../services/analyticsService');
    const userId = parseInt(req.query.user_id) || 1;
    const trend = await analyticsService.getWeeklyTrend(userId);
    res.json({ success: true, data: trend });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/historical-averages - Get historical spending averages
router.get('/historical-averages', async (req, res, next) => {
  try {
    const analyticsService = require('../services/analyticsService');
    const userId = parseInt(req.query.user_id) || 1;
    const averages = await analyticsService.getHistoricalAverages(userId);
    res.json({ success: true, data: averages });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
