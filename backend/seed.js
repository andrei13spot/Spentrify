require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const encryptionService = require('./services/encryption');

// Connect to Database
const db = new sqlite3.Database('./spentrify.db');

const USER_ID = 1; 

console.log("STARTING SEEDING PROCESS (Demo Mode)...");

db.serialize(() => {
  
  // 1. CLEANUP (Burahin muna ang luma ni User 1 para hindi mag-duplicate)
  console.log("Clearing old data for User 1...");
  db.run("DELETE FROM Transactions WHERE user_id = ?", [USER_ID]);
  db.run("DELETE FROM SavingsGoals WHERE user_id = ?", [USER_ID]);


  // 2. ENSURE USER EXISTS
  console.log("Ensuring Default User exists...");
  db.run(`INSERT OR IGNORE INTO Users (user_id, email_encrypted, passcode_hash) VALUES (?, ?, ?)`, 
    [USER_ID, encryptionService.encrypt('test@spentrify.com'), 'pass123']
  );

  // 3. ENSURE CATEGORIES EXIST
  console.log("Setting up Categories...");
  const categories = [
    { id: 1, name: 'Food & Drinks', icon: 'fast-food' },
    { id: 2, name: 'Transportation', icon: 'bus' },
    { id: 3, name: 'Shopping', icon: 'cart' },
    { id: 4, name: 'Education', icon: 'school' },
    { id: 5, name: 'Bills', icon: 'receipt' },
    { id: 13, name: 'Others', icon: 'ellipsis-horizontal' }
  ];

  categories.forEach(cat => {
    db.run(`INSERT OR IGNORE INTO Categories (category_id, category_name, icon_identifier, is_itr_deductible) VALUES (?, ?, ?, 0)`, 
      [cat.id, cat.name, cat.icon]
    );
  });

  // 4. INSERT TRANSACTIONS (The "Story")
  console.log("Injecting Transactions with History...");

  // Helper to generate dates (0 = today, -1 = yesterday, etc.)
  const getDate = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString();
  };

  const transactions = [
    // TODAY
    { amount: 150, merchant: 'Jollibee', desc: 'Lunch w/ groupmates', cat: 1, date: getDate(0) },
    { amount: 200, merchant: 'Grab', desc: 'Ride to school', cat: 2, date: getDate(0) },
    
    // YESTERDAY
    { amount: 180, merchant: 'Starbucks', desc: 'Coffee study session', cat: 1, date: getDate(1) },
    { amount: 50, merchant: '7-Eleven', desc: 'Snacks', cat: 1, date: getDate(1) },

    // LAST WEEK (Para sa "Weekly Trend" graph)
    { amount: 1500, merchant: 'National Bookstore', desc: 'Thesis materials', cat: 4, date: getDate(3) },
    { amount: 300, merchant: 'McDo', desc: 'Dinner', cat: 1, date: getDate(4) },
    { amount: 120, merchant: 'Tricycle', desc: 'Daily commute', cat: 2, date: getDate(5) },
    { amount: 1000, merchant: 'Uniqlo', desc: 'New shirt', cat: 3, date: getDate(6) },
    
    // LAST MONTH (Para makita sa history list)
    { amount: 2500, merchant: 'Meralco', desc: 'Electricity Share', cat: 5, date: getDate(15) },
    { amount: 5000, merchant: 'School Tuition', desc: 'Partial payment', cat: 4, date: getDate(20) },
  ];

  const stmt = db.prepare(`
    INSERT INTO Transactions 
    (user_id, category_id, amount_encrypted, merchant_name_encrypted, description_encrypted, transaction_date, source_type, is_manual) 
    VALUES (?, ?, ?, ?, ?, ?, 'Manual', 1)
  `);

  transactions.forEach(tx => {
    stmt.run(
      USER_ID,
      tx.cat,
      encryptionService.encrypt(tx.amount.toString()), // Encrypt Amount
      encryptionService.encrypt(tx.merchant),          // Encrypt Merchant
      encryptionService.encrypt(tx.desc),              // Encrypt Description
      tx.date
    );
  });
  stmt.finalize();

  // . INSERT GOALS
  console.log("Setting up Goals...");
  
  const goals = [
    { name: 'New Laptop', target: '60000', current: '15000', deadline: '12/31/2026' },
    { name: 'Boracay Trip', target: '15000', current: '14500', deadline: '05/20/2026' } // Almost achieved!
  ];

  const goalStmt = db.prepare(`
    INSERT INTO SavingsGoals 
    (user_id, name_encrypted, target_amount_encrypted, current_amount_encrypted, deadline_date) 
    VALUES (?, ?, ?, ?, ?)
  `);

  goals.forEach(g => {
    goalStmt.run(
      USER_ID,
      encryptionService.encrypt(g.name),
      encryptionService.encrypt(g.target),
      encryptionService.encrypt(g.current),
      g.deadline
    );
  });
  goalStmt.finalize();

});

// Finish
setTimeout(() => {
  db.close();
  console.log("\nSEEDING COMPLETE! Ready for Demo.");
  console.log("Login as User 1 (or any user mapped to ID 1) to see the data.");
}, 2000);