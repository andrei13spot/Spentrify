/**
 * Reset Test User Script
 * 
 * This script ensures the test user exists with the correct password.
 * Run this if login is not working: node reset-test-user.js
 */

require('dotenv').config();
const db = require('./database/connection');
const encryptionService = require('./services/encryption');
const authService = require('./services/authService');

const TEST_EMAIL = 'test@spentrify.com';
const TEST_PASSWORD = 'test123';

async function resetTestUser() {
  try {
    console.log('🔄 Resetting test user...\n');
    
    // Initialize database connection
    await db.initDb();
    
    // Normalize email
    const normalizedEmail = TEST_EMAIL.trim().toLowerCase();
    const emailEncrypted = encryptionService.encrypt(normalizedEmail);
    
    // Check if user exists
    const existingUsers = await db.query(
      'SELECT user_id, passcode_hash FROM Users WHERE email_encrypted = ? LIMIT 1',
      [emailEncrypted]
    );
    
    const passcodeHash = authService.hashPassword(TEST_PASSWORD);
    
    if (existingUsers.length > 0) {
      // Update existing user
      console.log('📝 Updating existing test user...');
      await db.run(
        'UPDATE Users SET passcode_hash = ? WHERE email_encrypted = ?',
        [passcodeHash, emailEncrypted]
      );
      console.log(`✅ Test user updated!`);
      console.log(`   User ID: ${existingUsers[0].user_id}`);
    } else {
      // Create new user
      console.log('➕ Creating new test user...');
      const result = await db.run(
        'INSERT INTO Users (email_encrypted, passcode_hash) VALUES (?, ?)',
        [emailEncrypted, passcodeHash]
      );
      console.log(`✅ Test user created!`);
      console.log(`   User ID: ${result.lastID}`);
    }
    
    // Verify the user can authenticate
    console.log('\n🔐 Verifying authentication...');
    try {
      const user = await authService.authenticateUser(TEST_EMAIL, TEST_PASSWORD);
      console.log('✅ Authentication successful!');
      console.log(`   User ID: ${user.user_id}`);
      console.log(`   Email: ${user.email}`);
    } catch (authError) {
      console.error('❌ Authentication failed:', authError.message);
      process.exit(1);
    }
    
    console.log('\n✅ Test user is ready!');
    console.log(`   Email: ${TEST_EMAIL}`);
    console.log(`   Password: ${TEST_PASSWORD}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting test user:', error);
    process.exit(1);
  }
}

resetTestUser();
