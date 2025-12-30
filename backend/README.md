# Spentrify Backend

Simple Express.js backend API for Spentrify (school project).

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the `backend` folder:
   ```env
   PORT=3000
   DB_PATH=./spentrify.db
   ENCRYPTION_KEY=your-32-byte-hex-key-here
   ```

3. Generate an encryption key:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Copy the output and paste it as `ENCRYPTION_KEY` in your `.env` file.

4. Start the server:
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

## API Endpoints

### Transactions
- `GET /api/transactions?user_id=xxx` - Get all transactions
- `GET /api/transactions/:id?user_id=xxx` - Get single transaction
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id?user_id=xxx` - Update transaction
- `DELETE /api/transactions/:id?user_id=xxx` - Delete transaction

### Health Check
- `GET /` - Server status

## Project Structure

```
backend/
├── server.js              # Main Express server
├── database/
│   └── connection.js      # SQLite database connection
├── services/
│   ├── encryption.js      # AES-256-GCM encryption
│   └── transactionsService.js
├── controllers/
│   └── transactionsController.js
├── routes/
│   └── transactions.js
└── middleware/
    └── errorHandler.js
```

## Notes

- All transaction amounts and descriptions are encrypted before saving to the database
- SQLite database file (`spentrify.db`) is created automatically on first run
- This is a school project - code is kept simple and readable

