// simple express server for Spentrify (school project)
// this file wires routes, database and basic middleware together

require('dotenv').config();


const express = require('express');
const cors = require('cors'); 
const { initDb } = require('./database/connection');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const transactionsRoutes = require('./routes/transactions');
const authRoutes = require('./routes/auth');
const categoriesRoutes = require('./routes/categories'); 
const budgetsRoutes = require('./routes/budgets');
const notificationsRoutes = require('./routes/notifications');
const exportsRoutes = require('./routes/exports');
const analyticsRoutes = require('./routes/analytics');
const insightsRoutes = require('./routes/insights');
const goalsRoutes = require('./routes/goals');

const app = express();
const port = process.env.PORT || 3000;


// ADDED: Enable CORS para tanggapin ang request mula sa Emulator/Mobile
app.use(cors());

// parse JSON bodies
app.use(express.json());

// simple health check route
app.get('/', (req, res) => {
  res.json({ message: 'Spentrify backend is running' });
});

app.use('/api/auth', authRoutes);



// transactions API (main thing for this project)
app.use('/api/transactions', transactionsRoutes);
app.use('/api/categories', categoriesRoutes); 
app.use('/api/notifications', notificationsRoutes);
app.use('/api/budgets', budgetsRoutes);
app.use('/api/goals', goalsRoutes);

// analytics API (UC-4: Spending Dashboard)
app.use('/api/analytics', analyticsRoutes);

// insights API (UC-3: Auto-Audit & Habit Analysis)
app.use('/api/insights', insightsRoutes);

// exports API (UC-6: ITR Support, UC-7: Reimbursement Mode)
app.use('/api/exports', exportsRoutes);

// 404 handler
app.use(notFoundHandler);

// error handler (kept simple on purpose)
app.use(errorHandler);

// start the server after we make sure the db tables exist
initDb()
  .then(() => {
    console.log('Database ready');
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
      console.log(`Android Emulator URL: http://10.0.2.2:${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to init database', err);
    process.exit(1);
  });


