
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// database file path from .env or default location
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'spentrify.db');
let db = null;

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('db error:', err); // basic log
        return reject(err);
      }
      resolve(rows);
    });
  });
}

// helper for INSERT/UPDATE/DELETE that returns the result object
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        console.error('db error:', err);
        return reject(err);
      }
      // 'this' contains lastID and changes
      resolve({
        lastID: this.lastID,
        changes: this.changes
      });
    });
  });
}

/**
 * DATABASE SCHEMA EXPLANATION
 * 
 * This schema follows the Spentrify system design with 5 main entities:
 * 
 * 1. Users - Stores user accounts and security settings
 *    - Email is encrypted (AES-256) for privacy
 *    - Supports cloud sync toggle
 *    - Stores passcode hash for biometric fallback
 * 
 * 2. Categories - Pre-defined and user-defined spending categories
 *    - Supports ITR (Income Tax Return) deductible flag
 *    - Used for organizing transactions
 * 
 * 3. Transactions - The core of the system
 *    - Stores all financial transactions (digital + manual)
 *    - Amount and merchant_name are encrypted
 *    - Supports multiple source types (GCash, Maya, BDO, Cash)
 *    - Tracks reimbursable expenses and receipt images
 * 
 * 4. AI_Insights - Auto-Audit Engine output
 *    - Stores AI-generated insights and alerts
 *    - Tracks read/unread status
 * 
 * ENCRYPTION NOTES:
 * - Sensitive fields use _encrypted suffix (amount_encrypted, email_encrypted, etc.)
 * - Encryption service handles AES-256-GCM encryption/decryption
 * - Foreign keys ensure data integrity
 * - Indexes improve query performance (< 2 second dashboard load requirement)
 * 
 * * Note: We encrypt sensitive stuff (emails, amounts) before saving
 * Foreign keys make sure data stays consistent (if user deleted, their transactions go too)
 * Indexes make queries faster (so dashboard loads quick)
 */



async function initDb() {
  return new Promise((resolve, reject) => {
    // Open the database file (creates it if it doesn't exist)
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('failed to open database:', err);
        return reject(err);
      }
      console.log('connected to SQLite database');
    });

    // Enable foreign key constraints (SQLite requires this to be enabled)
    db.run('PRAGMA foreign_keys = ON', (err) => {
      if (err) {
        console.warn('warning: could not enable foreign keys:', err);
      }
    });

    // Execute all table creation statements
    // We use a transaction to ensure all tables are created atomically
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // TABLE 1: Users - stores login info
      // email_encrypted: encrypted email (we encrypt it before saving)
      // passcode_hash: hashed password (never store plain passwords!)
      // is_cloud_sync_enabled: whether user wants cloud backup (0 = no, 1 = yes)
      db.run(`
        CREATE TABLE IF NOT EXISTS Users (
          user_id INTEGER PRIMARY KEY AUTOINCREMENT,
          email_encrypted TEXT NOT NULL,
          passcode_hash TEXT,
          is_cloud_sync_enabled INTEGER DEFAULT 0,
          last_sync_timestamp DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('failed to create Users table:', err);
          db.run('ROLLBACK');
          return reject(err);
        }
        console.log('✓ Users table created');
      });

      // Add new columns to Users table if they don't exist (migration)
      // This allows existing databases to be updated without losing data
      db.run(`ALTER TABLE Users ADD COLUMN full_name TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.warn('warning: could not add full_name column:', err.message);
        }
      });
      db.run(`ALTER TABLE Users ADD COLUMN phone TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.warn('warning: could not add phone column:', err.message);
        }
      });
      db.run(`ALTER TABLE Users ADD COLUMN is_email_verified INTEGER DEFAULT 0`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.warn('warning: could not add is_email_verified column:', err.message);
        }
      });

      // TABLE 2: Categories - spending categories like Food, Transport, etc.
      // category_name: must be unique (can't have two "Food" categories)
      // is_itr_deductible: 1 if it counts for tax deductions, 0 if not
      db.run(`
        CREATE TABLE IF NOT EXISTS Categories (
          category_id INTEGER PRIMARY KEY AUTOINCREMENT,
          category_name TEXT NOT NULL UNIQUE,
          is_itr_deductible INTEGER DEFAULT 0,
          icon_identifier TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('failed to create Categories table:', err);
          db.run('ROLLBACK');
          return reject(err);
        }
        console.log('✓ Categories table created');
      });

       // TABLE 3: Transactions - the main table! stores all spending
      // amount_encrypted: encrypted amount (encrypt before saving)
      // merchant_name_encrypted: encrypted store name
      // source_type: where the money came from ('GCash', 'Maya', 'BDO', 'Cash')
      // reference_number: unique ID from SMS (so we don't add duplicates)
      // is_manual: 1 if user entered manually, 0 if from SMS/auto
      // is_reimbursable: 1 if this expense can be reimbursed
      db.run(`
        CREATE TABLE IF NOT EXISTS Transactions (
          transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          category_id INTEGER,
          amount_encrypted TEXT NOT NULL,
          merchant_name_encrypted TEXT,
          description_encrypted TEXT,
          transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          source_type TEXT,
          reference_number TEXT UNIQUE,
          is_manual INTEGER DEFAULT 0,
          is_reimbursable INTEGER DEFAULT 0,
          receipt_image_path TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
          FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE SET NULL
        )
      `, (err) => {
        if (err) {
          console.error('failed to create Transactions table:', err);
          db.run('ROLLBACK');
          return reject(err);
        }
        console.log('✓ Transactions table created');
      });

      // TABLE 4: AI_Insights - AI suggestions and alerts
      // insight_type: what kind of insight ('Overspending', 'Subscription', 'Habit', 'ITR')
      // message: the actual message to show user
      // is_read: 0 = unread, 1 = read
      db.run(`
        CREATE TABLE IF NOT EXISTS AI_Insights (
          insight_id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          insight_type TEXT NOT NULL,
          message TEXT NOT NULL,
          is_read INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('failed to create AI_Insights table:', err);
          db.run('ROLLBACK');
          return reject(err);
        }
        console.log('✓ AI_Insights table created');
      });

      /**
       * TABLE 5: Notifications
       * Stores logs for every transaction and goal action
       */
      db.run(`
        CREATE TABLE IF NOT EXISTS Notifications (
          notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          is_read INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) console.error('Failed to create Notifications table:', err);
        else console.log('✓ Notifications table created');
      });

      // TABLE 6: SavingsGoals
      // Stores user goals with encrypted amounts and names
      db.run(`
        CREATE TABLE IF NOT EXISTS SavingsGoals (
          goal_id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name_encrypted TEXT NOT NULL,           -- Encrypted Goal Name (e.g. "Laptop")
          target_amount_encrypted TEXT NOT NULL,  -- Encrypted Target (e.g. "50000")
          current_amount_encrypted TEXT DEFAULT '0', -- Encrypted Current Savings
          deadline_date TEXT,                     -- Format: MM/DD/YYYY
          status TEXT DEFAULT 'IN_PROGRESS',      -- 'IN_PROGRESS' or 'COMPLETED'
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) console.error('failed to create SavingsGoals table:', err);
        else console.log('✓ SavingsGoals table created (Encrypted Mode)');
      });

      /**
       * INDEXES FOR PERFORMANCE
       * 
       * These indexes ensure fast queries for:
       * 1. Finding transactions by user (dashboard load < 2 seconds)
       * 2. Checking duplicate reference numbers (< 1 second pop-up)
       * 3. Filtering by category and date
       * 4. Finding budgets by user and category
       */
      
      // Index for fast user transaction queries
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_transactions_user_date 
        ON Transactions(user_id, transaction_date DESC)
      `, (err) => {
        if (err) console.warn('index creation warning:', err);
      });

      // Index for duplicate reference number check (critical for SMS parsing)
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_transactions_reference 
        ON Transactions(reference_number)
      `, (err) => {
        if (err) console.warn('index creation warning:', err);
      });

      // Index for category filtering
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_transactions_category 
        ON Transactions(category_id)
      `, (err) => {
        if (err) console.warn('index creation warning:', err);
      });

      // Index for budget queries
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_budgets_user_category 
        ON Budgets(user_id, category_id)
      `, (err) => {
        if (err) console.warn('index creation warning:', err);
      });

      // Index for AI insights (unread insights query)
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_insights_user_read 
        ON AI_Insights(user_id, is_read, created_at DESC)
      `, (err) => {
        if (err) console.warn('index creation warning:', err);
      });

      // Save all the table changes (commit the transaction)
      db.run('COMMIT', (err) => {
        if (err) {
          console.error('Failed to commit transaction:', err);
          return reject(err);
        }
        console.log('✓ Database schema initialized successfully');
        
        // Now add default data (categories and test user)
        seedDefaultCategories()
          .then(() => {
            console.log('✓ Default categories seeded');
            // Add test user after categories are done
            return seedTestUser();
          })
          .then(() => {
            console.log('✓ Test user seeded');
          resolve();
        })
        .catch((seedErr) => {
            console.warn('warning: could not seed data:', seedErr);
            resolve(); // Resolve pa rin para tumuloy ang app kahit fail ang seed
          });
      });
    });
  });
}
  


/**
 * SEED DEFAULT CATEGORIES
 * 
 * Inserts common spending categories that users will need.
 * These match the frontend category list and support ITR tracking.
 */
async function seedDefaultCategories() {
  const defaultCategories = [
    { name: 'Food', is_itr_deductible: 0 },
    { name: 'Groceries', is_itr_deductible: 0 },
    { name: 'Transportation', is_itr_deductible: 0 },
    { name: 'Electricity', is_itr_deductible: 1 },
    { name: 'Water', is_itr_deductible: 1 },
    { name: 'Internet', is_itr_deductible: 1 },
    { name: 'Rent', is_itr_deductible: 0 },
    { name: 'Entertainment', is_itr_deductible: 0 },
    { name: 'Shopping', is_itr_deductible: 0 },
    { name: 'Health', is_itr_deductible: 1 },
    { name: 'Education', is_itr_deductible: 1 },
    { name: 'Subscriptions', is_itr_deductible: 0 },
    { name: 'Others', is_itr_deductible: 0 }
  ];

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO Categories (category_name, is_itr_deductible)
        VALUES (?, ?)
      `);

      defaultCategories.forEach((cat) => {
        stmt.run(cat.name, cat.is_itr_deductible);
      });

      stmt.finalize((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
}
/**
 * Create a test user account for testing
 * 
 * This is a dummy account we use for testing the app
 * Credentials are shared with the team so everyone can test easily
 * 
 * TEST CREDENTIALS:
 * Email: test@spentrify.com
 * Password: test123
 * 
 * Only creates the user if it doesn't exist already (so we don't get duplicates)
 */
async function seedTestUser() {
  // Need these to encrypt email and hash password
  const encryptionService = require('../services/encryption');
  const authService = require('../services/authService');

  // Test account credentials (everyone on the team uses these)
  const TEST_EMAIL = 'test@spentrify.com';
  const TEST_PASSWORD = 'test123';

  return new Promise(async (resolve, reject) => {
    try {
      // Clean up the email (lowercase, no spaces)
      const normalizedEmail = TEST_EMAIL.trim().toLowerCase();
      
      // Check if test user already exists using authService (handles encryption correctly)
      const existingUser = await authService.findUserByEmail(normalizedEmail);

      // If it exists, verify the password hash is correct (recreate if needed)
      if (existingUser) {
        // Test if the password works with current hashing method
        try {
          await authService.authenticateUser(TEST_EMAIL, TEST_PASSWORD);
          console.log('✓ Test user already exists and password is correct');
          return resolve();
        } catch (_authError) {
          // Password doesn't match - update it with correct hash
          console.log('⚠ Test user exists but password hash is incorrect, updating...');
          const passcodeHash = authService.hashPassword(TEST_PASSWORD);
          await run(
            'UPDATE Users SET passcode_hash = ? WHERE user_id = ?',
            [passcodeHash, existingUser.user_id]
          );
          console.log('✓ Test user password updated');
          return resolve();
        }
      }

      // Create the test user using the same hashing method as authService
      // This ensures consistency between creation and login
      const emailEncrypted = encryptionService.encrypt(normalizedEmail);
      const passcodeHash = authService.hashPassword(TEST_PASSWORD);
      const result = await run(
        'INSERT INTO Users (email_encrypted, passcode_hash) VALUES (?, ?)',
        [emailEncrypted, passcodeHash]
      );

      // Log the credentials so team knows what to use
      console.log(`✓ Test user created with user_id: ${result.lastID}`);
      console.log(`  Email: ${TEST_EMAIL}`);
      console.log(`  Password: ${TEST_PASSWORD}`);
      resolve();
    } catch (error) {
      // If creating test user fails, don't crash the whole app
      // Database is still usable without the test user
      console.warn('warning: could not create test user:', error.message);
      resolve();
    }
  });
}

module.exports = {
  query,
  run,
  initDb
};

