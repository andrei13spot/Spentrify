/**
 * Budgets Service (Deprecated)
 * 
 * Note: Budgets have been formally deprecated in favor of SavingsGoals (ADR-0001).
 * Methods here return safe defaults to maintain backwards-compatibility
 * without throwing SQLite table-not-found errors.
 */

async function createBudget(data) {
  return { 
    id: 1, 
    ...data,
    deprecated: true,
    message: 'Budgets are deprecated. Use SavingsGoals (/api/goals).'
  };
}

async function getAllBudgets(_userId) {
  // Returns empty list safely
  return [];
}

async function getBudgetById(_id, _userId) {
  return null;
}

async function updateBudget(_id, _userId, _updates) {
  return null;
}

async function deleteBudget(_id, _userId) {
  return true;
}

module.exports = {
  createBudget,
  getAllBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget
};
