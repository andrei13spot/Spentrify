/**
 * Authentication Routes
 * 
 * Routes for user authentication (login, signup, etc.)
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/login - User login
router.post('/login', authController.login);

// POST /api/auth/signup - User registration
router.post('/signup', authController.signup);

// GET /api/auth/me - Get current user
router.get('/me', authController.getCurrentUser);

// PUT /api/auth/preferences - Update user preferences
router.put('/preferences', authController.updatePreferences);

// PUT /api/auth/profile - Update user profile
router.put('/profile', authController.updateProfile);

module.exports = router;
