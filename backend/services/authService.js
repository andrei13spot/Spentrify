/**
 * Authentication Service
 * 
 * Handles user authentication, password hashing, and user lookup.
 * Uses bcrypt for password hashing and encryption service for email.
 */

const db = require('../database/connection');
const encryptionService = require('./encryption');
const crypto = require('crypto');

/**
 * Hash a password using bcrypt
 * If bcrypt is not available, uses a simple SHA-256 hash (for development only)
 */
function hashPassword(password) {
  try {
    // Try to use bcrypt if available
    const bcrypt = require('bcrypt');
    // bcrypt.hashSync is synchronous and uses salt rounds
    return bcrypt.hashSync(password, 10);
  } catch (_error) {
    // Fallback to SHA-256 if bcrypt not installed (development only)
    console.warn('bcrypt not available, using SHA-256 fallback (not recommended for production)');
    return crypto.createHash('sha256').update(password).digest('hex');
  }
}

/**
 * Compare password with hash
 */
function comparePassword(password, hash) {
  try {
    const bcrypt = require('bcrypt');
    return bcrypt.compareSync(password, hash);
  } catch (_error) {
    // Fallback comparison for SHA-256
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    return passwordHash === hash;
  }
}

/**
 * Find user by email
 * @param {string} email - User email (will be normalized)
 * @returns {Promise<Object|null>} User object or null if not found
 */
async function findUserByEmail(email) {
  if (!email) {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();
  
  // Since encryption uses random IV, we can't search by encrypted email directly
  // Instead, we need to get all users and decrypt to compare
  // For better performance, we could add an email_hash column, but for now this works
  const allUsers = await db.query(
    'SELECT user_id, email_encrypted, passcode_hash, created_at FROM Users'
  );

  // Find user by decrypting and comparing emails
  for (const userRow of allUsers) {
    try {
      const decryptedEmail = encryptionService.decrypt(userRow.email_encrypted);
      if (decryptedEmail.toLowerCase() === normalizedEmail) {
        return {
          user_id: userRow.user_id,
          email: normalizedEmail,
          email_encrypted: userRow.email_encrypted,
          passcode_hash: userRow.passcode_hash,
          created_at: userRow.created_at
        };
      }
    } catch (error) {
      // Skip users with invalid encryption (shouldn't happen, but be safe)
      console.warn('Could not decrypt email for user:', userRow.user_id, error.message);
      continue;
    }
  }

  return null;
}

/**
 * Create a new user
 * @param {string} email - User email
 * @param {string} password - User password (will be hashed)
 * @returns {Promise<Object>} Created user object
 */
async function createUser(email, password, fullName) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const normalizedEmail = email.trim().toLowerCase();
  
  // Check if user already exists
  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  const emailEncrypted = encryptionService.encrypt(normalizedEmail);
  const passcodeHash = hashPassword(password);

  const result = await db.run(
    'INSERT INTO Users (email_encrypted, passcode_hash, full_name) VALUES (?, ?, ?)',
    [emailEncrypted, passcodeHash, fullName ? fullName.trim() : null]
  );

  return {
    user_id: result.lastID,
    email: normalizedEmail,
    created_at: new Date().toISOString()
  };
}

/**
 * Authenticate user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User object if authentication succeeds
 * @throws {Error} If authentication fails
 */
async function authenticateUser(email, password) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  if (!user.passcode_hash) {
    throw new Error('User account not properly set up');
  }

  const isValidPassword = comparePassword(password, user.passcode_hash);
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  return {
    user_id: user.user_id,
    email: user.email,
    created_at: user.created_at
  };
}

/**
 * Get user by ID
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} User object or null if not found
 */
async function getUserById(userId) {
  if (!userId) {
    return null;
  }

  const rows = await db.query(
    'SELECT user_id, email_encrypted, full_name, phone, is_email_verified, is_cloud_sync_enabled, last_sync_timestamp, created_at FROM Users WHERE user_id = ? LIMIT 1',
    [userId]
  );

  if (rows.length === 0) {
    return null;
  }

  const user = rows[0];
  // Decrypt email for convenience
  const email = encryptionService.decrypt(user.email_encrypted);
  
  return {
    user_id: user.user_id,
    email: email,
    full_name: user.full_name || null,
    phone: user.phone || null,
    is_email_verified: user.is_email_verified === 1,
    is_cloud_sync_enabled: user.is_cloud_sync_enabled === 1,
    last_sync_timestamp: user.last_sync_timestamp,
    created_at: user.created_at
  };
}

/**
 * Update user preferences
 * @param {number} userId - User ID
 * @param {Object} updates - Fields to update
 * @param {boolean} updates.is_cloud_sync_enabled - Cloud sync preference
 * @returns {Promise<Object>} Updated user object
 */
async function updateUserPreferences(userId, updates) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const fields = [];
  const values = [];

  if (updates.is_cloud_sync_enabled !== undefined) {
    fields.push('is_cloud_sync_enabled = ?');
    values.push(updates.is_cloud_sync_enabled ? 1 : 0);
    
    // Update sync timestamp when enabling cloud sync
    if (updates.is_cloud_sync_enabled) {
      fields.push('last_sync_timestamp = ?');
      values.push(new Date().toISOString());
    }
  }

  if (fields.length === 0) {
    return getUserById(userId);
  }

  values.push(userId);

  await db.run(
    `UPDATE Users SET ${fields.join(', ')} WHERE user_id = ?`,
    values
  );

  return getUserById(userId);
}

/**
 * Update user profile (name, phone)
 * @param {number} userId - User ID
 * @param {Object} updates - Fields to update
 * @param {string} updates.full_name - User's full name
 * @param {string} updates.phone - User's phone number
 * @returns {Promise<Object>} Updated user object
 */
async function updateUserProfile(userId, updates) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const fields = [];
  const values = [];

  if (updates.full_name !== undefined) {
    fields.push('full_name = ?');
    values.push(updates.full_name || null);
  }

  if (updates.phone !== undefined) {
    fields.push('phone = ?');
    values.push(updates.phone || null);
    if (updates.phone && String(updates.phone).trim().length > 0) {
      fields.push('is_email_verified = ?');
      values.push(1);
    }
  }

  if (fields.length === 0) {
    return getUserById(userId);
  }

  values.push(userId);

  await db.run(
    `UPDATE Users SET ${fields.join(', ')} WHERE user_id = ?`,
    values
  );

  return getUserById(userId);
}

/**
 * Update user password
 * @param {number} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 */
async function updatePassword(userId, currentPassword, newPassword) {
  if (!userId) {
    throw new Error('User ID is required');
  }
  if (!currentPassword || !newPassword) {
    throw new Error('Current and new password are required');
  }

  const rows = await db.query(
    'SELECT user_id, passcode_hash FROM Users WHERE user_id = ? LIMIT 1',
    [userId]
  );

  if (rows.length === 0) {
    throw new Error('User not found');
  }

  const user = rows[0];
  if (!user.passcode_hash) {
    throw new Error('User account not properly set up');
  }

  const isValid = comparePassword(currentPassword, user.passcode_hash);
  if (!isValid) {
    throw new Error('Invalid current password');
  }

  const newHash = hashPassword(newPassword);
  await db.run(
    'UPDATE Users SET passcode_hash = ? WHERE user_id = ?',
    [newHash, userId]
  );

  return true;
}

module.exports = {
  hashPassword,
  comparePassword,
  findUserByEmail,
  createUser,
  authenticateUser,
  getUserById,
  updateUserPreferences,
  updateUserProfile,
  updatePassword
};