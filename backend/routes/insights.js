/**
 * Insights Routes
 * 
 * Defines REST endpoints for AI insights.
 */

const express = require('express');
const router = express.Router();
const insightsController = require('../controllers/insightsController');

// GET /api/insights - Get unread insights
router.get('/', insightsController.getInsights);

// POST /api/insights/generate - Generate new insights
router.post('/generate', insightsController.generateInsights);

// PUT /api/insights/:id/read - Mark insight as read
router.put('/:id/read', insightsController.markAsRead);

module.exports = router;
