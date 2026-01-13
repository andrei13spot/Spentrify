/**
 * Export Controller
 * 
 * Handles HTTP requests for ITR and Reimbursement exports
 */

const exportService = require('../services/exportService');

/**
 * Generate ITR Export
 * GET /api/exports/itr?user_id=xxx&start_date=xxx&end_date=xxx
 */
async function getITRExport(req, res, next) {
  try {
    const userId = req.query.user_id;
    const startDate = req.query.start_date || new Date(new Date().getFullYear(), 0, 1).toISOString(); // Start of year
    const endDate = req.query.end_date || new Date().toISOString();

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const csvContent = await exportService.generateITRExport(userId, startDate, endDate);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="spentrify_itr_export_${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
}

/**
 * Generate Reimbursement Export
 * GET /api/exports/reimbursement?user_id=xxx&start_date=xxx&end_date=xxx
 */
async function getReimbursementExport(req, res, next) {
  try {
    const userId = req.query.user_id;
    const startDate = req.query.start_date || new Date(new Date().getFullYear(), 0, 1).toISOString();
    const endDate = req.query.end_date || new Date().toISOString();

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const csvContent = await exportService.generateReimbursementExport(userId, startDate, endDate);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="spentrify_reimbursement_export_${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
}

/**
 * Get ITR Summary (for preview)
 * GET /api/exports/itr/summary?user_id=xxx&start_date=xxx&end_date=xxx
 */
async function getITRSummary(req, res, next) {
  try {
    const userId = req.query.user_id;
    const startDate = req.query.start_date || new Date(new Date().getFullYear(), 0, 1).toISOString();
    const endDate = req.query.end_date || new Date().toISOString();

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const summary = await exportService.getITRSummary(userId, startDate, endDate);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getITRExport,
  getReimbursementExport,
  getITRSummary,
};
