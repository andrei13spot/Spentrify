/**
 * Categories Controller
 * 
 * Handles HTTP requests for category operations.
 * Categories are not encrypted as they are not sensitive financial data.
 */

const categoryService = require('../services/categoriesService');

/**
 * Get all categories
 * GET /api/categories
 */
async function getAllCategories(req, res, next) {
  try {
    const categories = await categoryService.getAllCategories();
    
    res.json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single category by ID
 * GET /api/categories/:id
 */
async function getCategoryById(req, res, next) {
  try {
    const { id } = req.params;
    const category = await categoryService.getCategoryById(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: { message: 'Category not found' }
      });
    }
    
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new category
 * POST /api/categories
 * 
 * Request body:
 * {
 *   "name": "string",
 *   "type": "income" | "expense"
 * }
 */
async function createCategory(req, res, next) {
  try {
    const { name, type } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required fields: name, type' }
      });
    }
    
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Type must be either "income" or "expense"' }
      });
    }
    
    const category = await categoryService.createCategory({ name, type });
    
    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(409).json({
        success: false,
        error: { message: 'Category with this name already exists' }
      });
    }
    next(error);
  }
}

/**
 * Update a category
 * PUT /api/categories/:id
 */
async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name, type } = req.body;
    
    if (type && !['income', 'expense'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Type must be either "income" or "expense"' }
      });
    }
    
    const category = await categoryService.updateCategory(id, { name, type });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: { message: 'Category not found' }
      });
    }
    
    res.json({
      success: true,
      data: category,
      message: 'Category updated successfully'
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(409).json({
        success: false,
        error: { message: 'Category with this name already exists' }
      });
    }
    next(error);
  }
}

/**
 * Delete a category
 * DELETE /api/categories/:id
 */
async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await categoryService.deleteCategory(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { message: 'Category not found' }
      });
    }
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};

