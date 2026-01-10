/**
 * Transactions Routes
 * 
 * Defines REST endpoints for transaction operations.
 * Routes delegate to controllers which handle request/response logic.
 */

const express = require('express');
const router = express.Router();
const transactionsController = require('../controllers/transactionsController');

// GET /api/transactions - Get all transactions
router.get('/', transactionsController.getAllTransactions);

// GET /api/transactions/:id - Get a single transaction
router.get('/:id', transactionsController.getTransactionById);

// POST /api/transactions - Create a new transaction
router.post('/', transactionsController.createTransaction);

// PUT /api/transactions/:id - Update a transaction
router.put('/:id', transactionsController.updateTransaction);

// DELETE /api/transactions/:id - Delete a transaction
router.delete('/:id', transactionsController.deleteTransaction);

module.exports = router;

