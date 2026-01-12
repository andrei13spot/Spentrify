// simple SQLite connection helper 
// SQLite is a file-based database, perfect for local development

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// database file path from .env or default location
// Gamitin ang process.cwd() para safe kahit anong Node version
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'spentrify_v2.db');
let db = null;

// small helper so we can use db.query with promises
// SQLite uses a callback style, so we wrap it
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
 * 4. Budgets - User-defined spending targets
 *    - Can be category-specific or overall
 *    - Supports different periods (Monthly, Weekly, etc.)
 * 
 * 5. AI_Insights - Auto-Audit Engine output
 *    - Stores AI-generated insights and alerts
 *    - Tracks read/unread status
 * 
 * ENCRYPTION NOTES:
 * - Sensitive fields use _encrypted suffix (amount_encrypted, email_encrypted, etc.)
 * - Encryption service handles AES-256-GCM encryption/decryption
 * - Foreign keys ensure data integrity
 * - Indexes improve query performance (< 2 second dashboard load requirement)
 */

async function initDb() {
  return new Promise((resolve, reject) => {
    // open or create the database file
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

      /**
       * TABLE 1: Users
       * Stores user accounts, authentication, and sync preferences
       */
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

      /**
       * TABLE 2: Categories
       * Pre-defined and user-defined spending categories
       * Used for organizing transactions and ITR support
       */
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

      /**
       * TABLE 3: Transactions
       * Core table storing all financial transactions
       * Supports both automated (SMS parsing) and manual entries
       * 
       * IMPORTANT FIELDS:
       * - amount_encrypted: Encrypted decimal value (use encryption service)
       * - merchant_name: Encrypted merchant/store name
       * - source_type: 'GCash', 'Maya', 'BDO', 'Cash', etc.
       * - reference_number: Unique ID from SMS/Push (indexed for fast duplicate check)
       * - is_manual: 1 for cash transactions, 0 for digital
       * - is_reimbursable: Flag for expense reimbursement tracking
       */
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

      /**
       * TABLE 4: Budgets
       * User-defined spending targets and goals
       * Can be category-specific or overall budget
       * 
       * PERIOD VALUES: 'Daily', 'Weekly', 'Monthly', 'Yearly'
       * category_id: NULL means overall budget, otherwise category-specific
       */
      db.run(`
        CREATE TABLE IF NOT EXISTS Budgets (
          budget_id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          category_id INTEGER,
          target_amount_encrypted TEXT NOT NULL,
          period TEXT DEFAULT 'Monthly',
          start_date DATE,
          end_date DATE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
          FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE SET NULL
        )
      `, (err) => {
        if (err) {
          console.error('failed to create Budgets table:', err);
          db.run('ROLLBACK');
          return reject(err);
        }
        console.log('✓ Budgets table created');
      });

      /**
       * TABLE 5: AI_Insights
       * Stores Auto-Audit Engine generated insights and alerts
       * 
       * INSIGHT TYPES:
       * - 'Overspending': User exceeded budget
       * - 'Subscription': Recurring payment detected
       * - 'Habit': Spending pattern identified
       * - 'ITR': Tax-deductible expense reminder
       */
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
       * TABLE 6: Notifications
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
        else console.log('Notifications table created');
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

      // Commit transaction
      db.run('COMMIT', async (err) => {
        if (err) {
          console.error('failed to commit transaction:', err);
          return reject(err);
        }
        
        // FIX: Seed Default User and Categories
        try {
            await seedDefaultUser(); // <--- ITO ANG BAGONG IDINAGDAG
            await seedDefaultCategories();
            console.log('✓ Database initialized with Default User');
            resolve();
        } catch (seedErr) {
            console.warn('Seeding warning:', seedErr);
            resolve();
        }
      });
    });
  });
 }

// FIX: Add this new function sa baba ng file (before module.exports)
function seedDefaultUser() {
  return new Promise((resolve, reject) => {
    // user ID = 1
    const sql = `INSERT OR IGNORE INTO Users (user_id, email_encrypted, passcode_hash) 
                 VALUES (1, 'default_user_enc', 'pass123')`;
    db.run(sql, (err) => {
      if (err) reject(err);
      else {
        console.log('✓ Default User (ID: 1) created');
        resolve();
      }
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

module.exports = {
  query,
  run,
  initDb
};

