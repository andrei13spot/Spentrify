// simple express server for Spentrify (school project)
// this file wires routes, database and basic middleware together

require('dotenv').config();

const express = require('express');
const { initDb } = require('./database/connection');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const transactionsRoutes = require('./routes/transactions');

const app = express();
const port = process.env.PORT || 3000;

// parse JSON bodies
app.use(express.json());

// simple health check route
app.get('/', (req, res) => {
  res.json({ message: 'Spentrify backend is running' });
});

// transactions API (main thing for this project)
app.use('/api/transactions', transactionsRoutes);

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


