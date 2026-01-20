/**
 * Categories Routes
 * 
 * Defines REST endpoints for category operations.
 */

const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categoriesController');

// GET /api/categories - Get all categories
router.get('/', categoriesController.getAllCategories);

// GET /api/categories/:id - Get a single category
router.get('/:id', categoriesController.getCategoryById);

// POST /api/categories - Create a new category
router.post('/', categoriesController.createCategory);

// PUT /api/categories/:id - Update a category
router.put('/:id', categoriesController.updateCategory);

// DELETE /api/categories/:id - Delete a category
router.delete('/:id', categoriesController.deleteCategory);

module.exports = router;

