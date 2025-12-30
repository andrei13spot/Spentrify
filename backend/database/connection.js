// simple SQLite connection helper for this project
// SQLite is a file-based database, perfect for local development

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// database file path from .env or default location
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'spentrify.db');

let db = null;

// small helper so we can use db.query with promises
// SQLite uses a callback style, so we wrap it
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('db error:', err); // basic log, good enough for school project
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

// this creates the basic tables we need for now
// note: amounts and descriptions are stored encrypted as strings
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

    // transactions table only for this simple version
    // SQLite uses INTEGER PRIMARY KEY AUTOINCREMENT
    const sql = `
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        amount_encrypted TEXT NOT NULL,
        description_encrypted TEXT,
        transaction_date TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `;

    db.run(sql, (err) => {
      if (err) {
        console.error('failed to create table:', err);
        return reject(err);
      }
      console.log('database initialized');
      resolve();
    });
  });
}

module.exports = {
  query,
  run,
  initDb
};

