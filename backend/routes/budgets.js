/**
 * Budgets Routes
 * 
 * Defines REST endpoints for budget operations.
 */

const express = require('express');
const router = express.Router();
const budgetsController = require('../controllers/budgetsController');

// GET /api/budgets - Get all budgets
router.get('/', budgetsController.getAllBudgets);

// GET /api/budgets/:id - Get a single budget
router.get('/:id', budgetsController.getBudgetById);

// POST /api/budgets - Create a new budget
router.post('/', budgetsController.createBudget);

// PUT /api/budgets/:id - Update a budget
router.put('/:id', budgetsController.updateBudget);

// DELETE /api/budgets/:id - Delete a budget
router.delete('/:id', budgetsController.deleteBudget);

module.exports = router;

