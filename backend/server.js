// simple express server for Spentrify (school project)
// this file wires routes, database and basic middleware together

require('dotenv').config();


const express = require('express');
const cors = require('cors'); // ADDED: Import cors
const { initDb, run } = require('./database/connection');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const transactionsRoutes = require('./routes/transactions');
const categoriesRoutes = require('./routes/categories'); 
const budgetsRoutes = require('./routes/budgets');
const notificationsRoutes = require('./routes/notifications');

const app = express();
const port = process.env.PORT || 3000;

// --- DEBUGGER CODE (Isingit mo to) ---
console.log("Check Routes Type:");
console.log("Transactions:", typeof transactionsRoutes);
console.log("Categories:", typeof categoriesRoutes);
console.log("Notifications:", typeof notificationsRoutes);
console.log("Budgets:", typeof budgetsRoutes); // <-- Dapat 'function', HINDI 'object'
// -------------------------------------

// ADDED: Enable CORS para tanggapin ang request mula sa Emulator/Mobile
app.use(cors());

// parse JSON bodies
app.use(express.json());

// simple health check route
app.get('/', (req, res) => {
  res.json({ message: 'Spentrify backend is running' });
});

app.get('/fix-database', async (req, res) => {
  try {
    // Force Create User 1
    await run(`INSERT OR IGNORE INTO Users (user_id, email_encrypted, passcode_hash) VALUES (1, 'default_user', 'pass123')`);
    
    // Force Create Category 1 (Food)
    await run(`INSERT OR IGNORE INTO Categories (category_id, category_name, is_itr_deductible) VALUES (1, 'Food', 0)`);

    res.send('SUCCESS: Database fixed! User 1 and Category 1 are now ready.');
  } catch (error) {
    res.send('ERROR: ' + error.message);
  }
});

// transactions API (main thing for this project)
app.use('/api/transactions', transactionsRoutes);
app.use('/api/categories', categoriesRoutes); // ADDED: Enable Categories endpoint
app.use('/api/notifications', notificationsRoutes);
app.use('/api/budgets', budgetsRoutes);
app.use('/api/goals', budgetsRoutes);

// 404 handler
app.use(notFoundHandler);

// error handler (kept simple on purpose)
app.use(errorHandler);

// start the server after we make sure the db tables exist
initDb()
  .then(() => {
    console.log('database ready');
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
      console.log(`Android Emulator URL: http://10.0.2.2:${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to init database', err);
    process.exit(1);
  });


