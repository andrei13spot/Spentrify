# Complete Git Workflow Guide for Spentrify

This guide provides all the git commands you need for the complete workflow from feature branch to production.

---

## 📋 Complete Workflow Steps

### Step 1: Create a Feature Branch from `develop`

```bash
# Make sure you're in the project directory
cd "C:\Users\ASUS TUF\Documents\Practice Coding\Spentrify"

# Switch to develop branch
git checkout develop

# Pull latest changes from remote
git pull origin develop

# Create and switch to your feature branch
# For frontend features:
git checkout -b frontend/your-feature-name

# OR for backend features:
git checkout -b backend/your-feature-name
```

**Examples:**
```bash
git checkout -b frontend/user-dashboard
git checkout -b frontend/transaction-list
git checkout -b backend/api-endpoints
git checkout -b backend/database-schema
```

---

### Step 2: Develop and Commit Your Changes

```bash
# Make your code changes (edit files, add features, etc.)

# Check what files you've changed
git status

# Stage specific files
git add path/to/file.js
git add path/to/another-file.js

# OR stage all changes
git add .

# Commit your changes with a descriptive message
git commit -m "feat: add user dashboard component"

# Good commit message format:
# - feat: for new features
# - fix: for bug fixes
# - refactor: for code restructuring
# - docs: for documentation
# - style: for formatting
```

**Example workflow:**
```bash
# Make changes to files
# ... edit files ...

# Stage changes
git add frontend/components/Dashboard.tsx
git add frontend/screens/HomeScreen.tsx

# Commit
git commit -m "feat: implement user dashboard with transaction summary"
```

---

### Step 3: Push Your Feature Branch to GitHub

```bash
# Push your branch to remote (first time)
git push origin frontend/your-feature-name

# OR for backend
git push origin backend/your-feature-name

# If branch already exists on remote, use:
git push origin frontend/your-feature-name
```

**Example:**
```bash
git push origin frontend/user-dashboard
```

---

### Step 4: Create Pull Request on GitHub

1. Go to: https://github.com/andrei13spot/Spentrify
2. Click **"Pull requests"** tab
3. Click **"New pull request"**
4. Set:
   - **Base branch**: `develop` ← (where you want to merge TO)
   - **Compare branch**: `frontend/your-feature-name` ← (your feature branch)
5. Click **"Create pull request"**
6. Add title and description
7. Click **"Create pull request"**

**PR Title Examples:**
- `feat: add user dashboard component`
- `backend: implement transaction parsing service`
- `fix: resolve authentication bug`

---

### Step 5: After Review - Merge PR into `develop`

**On GitHub:**
1. Go to your Pull Request page
2. Review the changes
3. Click **"Merge pull request"**
4. Click **"Confirm merge"**
5. (Optional) Click **"Delete branch"** to clean up

**OR merge locally:**
```bash
# Switch to develop
git checkout develop

# Pull latest changes
git pull origin develop

# Merge your feature branch
git merge frontend/your-feature-name

# Push merged changes
git push origin develop

# Delete local feature branch (optional)
git branch -d frontend/your-feature-name

# Delete remote feature branch (optional)
git push origin --delete frontend/your-feature-name
```

---

### Step 6: When `develop` is Stable - Merge to `main`

**When your project is demo-ready and stable:**

```bash
# Switch to main branch
git checkout main

# Pull latest main (in case others updated it)
git pull origin main

# Merge develop into main
git merge develop

# Push to GitHub
git push origin main
```

**OR create a PR on GitHub:**
1. Go to: https://github.com/andrei13spot/Spentrify
2. Click **"Pull requests"** → **"New pull request"**
3. Set:
   - **Base**: `main`
   - **Compare**: `develop`
4. Create PR and merge when ready

---

## 🔄 Complete Example Workflow

### Example: Adding a New Frontend Feature

```bash
# 1. Start from develop
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b frontend/add-transaction-form

# 3. Make changes
# ... edit files ...

# 4. Commit changes
git add frontend/components/TransactionForm.tsx
git commit -m "feat: add transaction form component"

# 5. Push branch
git push origin frontend/add-transaction-form

# 6. Create PR on GitHub: frontend/add-transaction-form → develop

# 7. After PR is merged, update local develop
git checkout develop
git pull origin develop

# 8. Delete local feature branch
git branch -d frontend/add-transaction-form
```

---

## 🛠️ Useful Git Commands Reference

### Checking Status
```bash
# See current branch and changes
git status

# See commit history
git log --oneline -10

# See all branches
git branch -a
```

### Switching Branches
```bash
# Switch to a branch
git checkout branch-name

# Create and switch to new branch
git checkout -b new-branch-name
```

### Staging and Committing
```bash
# Stage all changes
git add .

# Stage specific file
git add path/to/file.js

# Unstage a file
git restore --staged path/to/file.js

# Commit changes
git commit -m "your commit message"

# Amend last commit (if you forgot something)
git commit --amend -m "updated commit message"
```

### Pushing and Pulling
```bash
# Push current branch
git push origin branch-name

# Pull latest changes
git pull origin branch-name

# Fetch without merging
git fetch origin
```

### Merging
```bash
# Merge a branch into current branch
git merge branch-name

# Merge with no-edit (uses default merge message)
git merge branch-name --no-edit
```

### Viewing Differences
```bash
# See what changed
git diff

# See staged changes
git diff --staged

# Compare branches
git diff develop..feature-branch
```

### Undoing Changes
```bash
# Discard uncommitted changes to a file
git restore path/to/file.js

# Discard all uncommitted changes
git restore .

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1
```

---

## ⚠️ Common Issues and Solutions

### Issue: "Your branch is behind 'origin/develop'"
```bash
# Pull latest changes
git pull origin develop
```

### Issue: "Updates were rejected (non-fast-forward)"
```bash
# Pull and merge first
git pull origin develop

# Then push
git push origin develop
```

### Issue: Merge conflicts
```bash
# When you see conflicts after git pull:
# 1. Open conflicted files
# 2. Look for <<<<<<< HEAD markers
# 3. Resolve conflicts manually
# 4. Stage resolved files
git add path/to/resolved-file.js
# 5. Complete the merge
git commit
```

### Issue: Accidentally committed to wrong branch
```bash
# Undo last commit (keeps changes)
git reset --soft HEAD~1

# Switch to correct branch
git checkout correct-branch

# Commit again
git commit -m "your message"
```

---

## 📝 Branch Naming Convention

**Frontend branches:**
- `frontend/user-authentication`
- `frontend/transaction-history`
- `frontend/dashboard-ui`

**Backend branches:**
- `backend/api-endpoints`
- `backend/database-schema`
- `backend/auth-service`

**Bugfix branches:**
- `frontend/bugfix-login-error`
- `backend/bugfix-encryption-issue`

---

## ✅ Quick Checklist

Before creating a PR:
- [ ] All changes committed
- [ ] Branch pushed to GitHub
- [ ] Code tested locally
- [ ] No merge conflicts
- [ ] Follows project structure

Before merging to main:
- [ ] All features complete
- [ ] Code reviewed
- [ ] No known bugs
- [ ] Documentation updated
- [ ] Demo-ready

---

## 🎯 Current Project Status

**Current branches:**
- `main` - Production/demo-ready code
- `develop` - Integration branch (active development)
- `backend/initial-setup` - Backend setup (already merged)
- `backend/transaction-parsing` - Transaction parsing feature

**Current structure:**
```
Spentrify/
├── backend/          ← Backend API
├── frontend/         ← Frontend app
├── docs/             ← Documentation
├── BRANCHING.md      ← Branching strategy
└── README.md         ← Project readme
```

---

**Remember:** Always work on feature branches, never directly on `main` or `develop`!

