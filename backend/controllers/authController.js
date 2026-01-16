/**
 * Authentication Controller
 * 
 * Handles HTTP requests for user authentication (login, signup).
 */

const authService = require('../services/authService');

/**
 * User login
 * POST /api/auth/login
 * 
 * Body: { email: string, password: string }
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const user = await authService.authenticateUser(email, password);

    res.json({
      success: true,
      data: {
        user_id: user.user_id,
        email: user.email,
        created_at: user.created_at
      }
    });
  } catch (error) {
    if (error.message.includes('Invalid') || error.message.includes('not found')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }
    next(error);
  }
}

/**
 * User signup/registration
 * POST /api/auth/signup
 * 
 * Body: { email: string, password: string }
 */
async function signup(req, res, next) {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Basic validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    const user = await authService.createUser(email, password, full_name);

    res.status(201).json({
      success: true,
      data: {
        user_id: user.user_id,
        email: user.email,
        created_at: user.created_at
      }
    });
  } catch (error) {
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }
    next(error);
  }
}

/**
 * Get current user info
 * GET /api/auth/me?user_id=xxx
 */
async function getCurrentUser(req, res, next) {
  try {
    const userId = req.query.user_id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const user = await authService.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update user preferences
 * PUT /api/auth/preferences?user_id=xxx
 * Body: { is_cloud_sync_enabled: boolean }
 */
async function updatePreferences(req, res, next) {
  try {
    const userId = req.query.user_id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const user = await authService.updateUserPreferences(userId, req.body);

    res.json({
      success: true,
      data: user,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update user profile
 * PUT /api/auth/profile?user_id=xxx
 * Body: { full_name: string, phone: string }
 */
async function updateProfile(req, res, next) {
  try {
    const userId = req.query.user_id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const { full_name, phone } = req.body;

    const user = await authService.updateUserProfile(userId, {
      full_name,
      phone
    });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update user password
 * PUT /api/auth/password?user_id=xxx
 * Body: { current_password: string, new_password: string }
 */
async function updatePassword(req, res, next) {
  try {
    const userId = Number(req.query.user_id);
    const { current_password, new_password } = req.body;

    if (Number.isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        error: 'Current and new password are required'
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    await authService.updatePassword(userId, current_password, new_password);

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    if (error.message && error.message.includes('Invalid current password')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid current password'
      });
    }
    if (error.message && error.message.includes('User not found')) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    next(error);
  }
}

module.exports = {
  login,
  signup,
  getCurrentUser,
  updatePreferences,
  updateProfile,
  updatePassword
};