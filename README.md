# Spentrify
Smart spending and transaction auditing app with insights, goals, and exports.

## Overview
Spentrify is a mobile-first spending tracker built with Expo Router and a lightweight
Express + SQLite backend. It supports manual expense logging, SMS-based transaction
detection on Android, budget and savings goal tracking, analytics dashboards, and
insight summaries. The current branch includes the notifications page with delete
and clear-all flows backed by the API.

## Current Functionality
- Authentication: email signup/login, session persistence, and profile editing
- Transactions: add, edit, delete, and view recent activity with category filters
- SMS detection (Android): listens to bank SMS and opens a categorization pop-up
- Budgets and goals: create, edit, and track savings progress with adjustments
- Insights: weekly trends, top categories, overspending alerts, and Gemini summaries
- Analytics: category breakdowns and historical averages for spending patterns
- Notifications: inbox list, single delete, and clear-all actions (API-backed)
- Exports: ITR and reimbursement CSV exports with preview summaries
- Settings: cloud sync preference (backend), biometric toggle (local), logout
- Security: change password flow and account delete UI entry

## Tech Stack
- Mobile app: Expo, React Native, Expo Router, Zustand, Axios
- Backend: Express.js, SQLite, Node.js
- Security: AES-256-GCM encryption for sensitive fields
- Charts: react-native-svg

## Local Setup

### 1) Install dependencies
```bash
npm install
```

### 2) Start the backend
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=3000
DB_PATH=./spentrify.db
ENCRYPTION_KEY=your-32-byte-hex-key-here
```

Generate an encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Start the server:
```bash
npm start
# or
npm run dev
```

### 3) Start the app
```bash
cd ..
npm start
```

Optional: set `EXPO_PUBLIC_API_URL` in your Expo environment if you are not using
the default `http://10.0.2.2:3000` (Android) or `http://localhost:3000` (iOS/Web).

## Key Screens
- Home: monthly summary, category breakdowns, and recent transactions
- Add Transaction: manual entry with category and date
- Insights: rule-based and Gemini modes, charts, and detailed view
- Goals: savings targets with progress and adjustments
- Notifications: list, delete, and clear all
- Exports: ITR and reimbursement CSV generation
- Settings: profile, security, and preferences

## Repository Structure
```
app/                # Expo Router screens
backend/            # Express + SQLite API
components/         # Reusable UI components
context/            # Auth, data, and notifications providers
utils/              # Helpers (date, etc.)
```

## Documentation
- Branching and workflow: [BRANCHING.md](./BRANCHING.md)
- Git flow reference: [GIT_WORKFLOW.md](./GIT_WORKFLOW.md)