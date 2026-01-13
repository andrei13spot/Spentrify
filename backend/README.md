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

## 🧪 Test Account

A default test account is **automatically created** when you first start the backend server:

- **Email**: `test@spentrify.com`
- **Password**: `test123`

### How It Works

1. When you run `npm start` or `npm run dev` for the first time, the database is automatically initialized
2. The test user is created automatically with the credentials above
3. **Everyone on the team gets the same test credentials** - perfect for testing!
4. The database file (`spentrify.db`) is created locally on your machine (not shared via Git)

### First Time Setup

```bash
# 1. Install dependencies
npm install

# 2. Create .env file (see Setup section above)

# 3. Start the server - database and test user will be created automatically!
npm start
```

You should see in the console:
```
✓ Users table created
✓ Categories table created
✓ Default categories seeded
✓ Test user seeded
  Email: test@spentrify.com
  Password: test123
```

**Note**: Each team member has their own local database file, but everyone gets the same test user credentials automatically!

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login (email/password)
- `POST /api/auth/signup` - User registration (email/password)
- `GET /api/auth/me?user_id=xxx` - Get current user info

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
│   ├── authService.js      # User authentication & password hashing
│   └── transactionsService.js
├── controllers/
│   ├── authController.js   # Authentication endpoints
│   └── transactionsController.js
├── routes/
│   ├── auth.js             # Authentication routes
│   └── transactions.js
└── middleware/
    └── errorHandler.js
```

## Notes

- All transaction amounts and descriptions are encrypted before saving to the database
- User emails are encrypted before storage
- Passwords are hashed using bcrypt (with SHA-256 fallback)
- SQLite database file (`spentrify.db`) is created automatically on first run
- This is a school project - code is kept simple and readable

## Authentication

The backend supports email/password authentication:
- Passwords are securely hashed using bcrypt
- Emails are encrypted using AES-256-GCM
- OAuth providers (Google, Facebook, Apple) can be added by implementing token validation endpoints
