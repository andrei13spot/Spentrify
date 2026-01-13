// simple express server for Spentrify (school project)
// this file wires routes, database and basic middleware together

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { initDb } = require('./database/connection');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const transactionsRoutes = require('./routes/transactions');
const authRoutes = require('./routes/auth');
const budgetsRoutes = require('./routes/budgets');
const categoriesRoutes = require('./routes/categories');
const exportsRoutes = require('./routes/exports');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for React Native app
// This allows the mobile app to make requests to the backend
app.use(cors({
  origin: '*', // Allow all origins (for development)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

// parse JSON bodies
app.use(express.json());

// simple health check route
app.get('/', (req, res) => {
  res.json({ message: 'Spentrify backend is running' });
});

// authentication API
app.use('/api/auth', authRoutes);

// transactions API (main thing for this project)
app.use('/api/transactions', transactionsRoutes);

// budgets API
app.use('/api/budgets', budgetsRoutes);

// categories API
app.use('/api/categories', categoriesRoutes);

// exports API (UC-6: ITR Support, UC-7: Reimbursement Mode)
app.use('/api/exports', exportsRoutes);

// 404 handler
app.use(notFoundHandler);

// error handler (kept simple on purpose)
app.use(errorHandler);

// start the server after we make sure the db tables exist
initDb()
  .then(() => {
    console.log('database ready');
    app.listen(port, () => {
      console.log(`server listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('failed to init database', err);
    process.exit(1);
  });


