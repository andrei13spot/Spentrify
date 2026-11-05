require('dotenv').config(); // Load the Secret Key
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const encryptionService = require('./services/encryption');

// Connect to Database
const dbPath = './spentrify.db';
const db = new sqlite3.Database(dbPath);

console.log("INSPECTING DATABASE (DECRYPTED VIEW)...\n");

db.serialize(() => {
  
  // 1. CHECK GOALS
  console.log("--- GOALS ---");
  db.all("SELECT * FROM SavingsGoals", (err, rows) => {
    if (err) {
      console.log("Error reading Goals:", err.message);
      return;
    }

    if (rows.length === 0) {
      console.log("No goals found.");
    } else {
      // Decrypt Data for Display
      const decryptedRows = rows.map(row => ({
        ID: row.goal_id,
        Name: encryptionService.decrypt(row.name_encrypted), // DECRYPT NAME
        Target: encryptionService.decrypt(row.target_amount_encrypted), // DECRYPT TARGET
        Current: encryptionService.decrypt(row.current_amount_encrypted), // DECRYPT CURRENT
        Deadline: row.deadline_date
      }));
      
      // Print as a clean table
      console.table(decryptedRows);
    }
  });

});

// Close connection after a short delay to allow queries to finish
setTimeout(() => {
  db.close();
  console.log("\nInspection Complete.");
}, 1000);