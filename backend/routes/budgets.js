/**
 * Budgets Routes
 * 
 * Defines REST endpoints for budget operations.
 */

const express = require('express');
const router = express.Router();
const budgetsController = require('../controllers/budgetsController'); // Siguraduhin na tama ang path na ito

// Define Routes
router.get('/', budgetsController.getAllBudgets);
router.post('/', budgetsController.createBudget);
router.get('/:id', budgetsController.getBudgetById);
router.put('/:id', budgetsController.updateBudget);
router.delete('/:id', budgetsController.deleteBudget);

module.exports = router;

