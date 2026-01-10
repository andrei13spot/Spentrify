# Branching Strategy

This document outlines the branching strategy for the Spentrify project.

## Branch Types

### 1. `main`
- **Purpose**: Final, stable, demo-ready code ONLY
- **Protection**: Should be protected and require pull request reviews
- **Usage**: Only merge from `develop` when code is production-ready

### 2. `develop`
- **Purpose**: Integration branch where all features are merged
- **Usage**: All feature branches merge into `develop` first
- **Status**: Active development branch

### 3. `frontend/*`
- **Purpose**: Frontend feature branches
- **Naming Convention**: `frontend/feature-name` or `frontend/bugfix-name`
- **Examples**: 
  - `frontend/user-dashboard`
  - `frontend/transaction-list`
  - `frontend/auth-ui`

### 4. `backend/*`
- **Purpose**: Backend feature branches
- **Naming Convention**: `backend/feature-name` or `backend/bugfix-name`
- **Examples**:
  - `backend/api-endpoints`
  - `backend/database-schema`
  - `backend/auth-service`

## Workflow

1. Create a feature branch from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b frontend/your-feature-name
   # or
   git checkout -b backend/your-feature-name
   ```

2. Develop and commit your changes on the feature branch

3. Push your feature branch and create a pull request to `develop`

4. After review and approval, merge into `develop`

5. When `develop` is stable and demo-ready, merge into `main`

## Branch Naming Examples

- ✅ `frontend/user-authentication`
- ✅ `frontend/transaction-history`
- ✅ `backend/api-transactions`
- ✅ `backend/db-migrations`
- ❌ `feature/user-auth` (use `frontend/` or `backend/` prefix)
- ❌ `fix/bug-123` (use `frontend/` or `backend/` prefix)




