/**
 * Export Routes
 * 
 * Routes for ITR and Reimbursement exports
 */

const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');

// GET /api/exports/itr - Generate ITR export (CSV)
router.get('/itr', exportController.getITRExport);

// GET /api/exports/itr/summary - Get ITR summary (for preview)
router.get('/itr/summary', exportController.getITRSummary);

// GET /api/exports/reimbursement - Generate Reimbursement export (CSV)
router.get('/reimbursement', exportController.getReimbursementExport);

module.exports = router;
