/**
 * Analytics Service
 * 
 * Provides spending analytics, summaries, and category breakdowns.
 * Implements UC-4: Spending Dashboard features.
 */

const { query } = require('../database/connection');
const encryptionService = require('./encryption');

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get spending analytics for a user
 * @param {number} userId - User ID
 * @param {Object} options - Query options (period, categoryId)
 * @returns {Promise<Object>} Analytics data
 */
async function getSpendingAnalytics(userId, options = {}) {
  const { period, categoryId } = options;
  
  // Build date filter
  let dateFilter = '';
  const params = [userId];
  
  if (period) {
    // period format: "2024-01" (YYYY-MM)
    dateFilter = 'AND strftime("%Y-%m", t.transaction_date) = ?';
    params.push(period);
  }
  
  if (categoryId) {
    dateFilter += ' AND t.category_id = ?';
    params.push(categoryId);
  }
  
  const sql = `
    SELECT 
      t.transaction_id,
      t.amount_encrypted,
      t.transaction_date,
      t.category_id,
      c.category_name,
      c.icon_identifier
    FROM Transactions t
    LEFT JOIN Categories c ON t.category_id = c.category_id
    WHERE t.user_id = ? ${dateFilter}
    ORDER BY t.transaction_date DESC
  `;
  
  const rows = await query(sql, params);
  
  // Decrypt and process
  const transactions = rows.map(row => ({
    id: row.transaction_id,
    amount: parseFloat(encryptionService.decrypt(row.amount_encrypted)),
    date: row.transaction_date,
    category_id: row.category_id,
    category_name: row.category_name || 'Others',
    icon: row.icon_identifier
  }));
  
  const total = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  
  return {
    total,
    transactionCount: transactions.length,
    transactions,
    period: period || 'all-time'
  };
}

/**
 * Get spending summary
 * @param {number} userId - User ID
 * @param {string} period - Optional period filter (e.g., "2024-01")
 * @returns {Promise<Object>} Summary data
 */
async function getSpendingSummary(userId, period = null) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const targetPeriod = period || currentMonth;
  
  // Current period spending
  const current = await getSpendingAnalytics(userId, { period: targetPeriod });
  
  // Previous period for comparison
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevPeriod = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  const previous = await getSpendingAnalytics(userId, { period: prevPeriod });
  
  const change = previous.total > 0 
    ? ((current.total - previous.total) / previous.total) * 100 
    : 0;
  
  return {
    current: {
      total: current.total,
      count: current.transactionCount,
      period: targetPeriod
    },
    previous: {
      total: previous.total,
      count: previous.transactionCount,
      period: prevPeriod
    },
    change: {
      amount: current.total - previous.total,
      percentage: change
    }
  };
}

/**
 * Get spending breakdown by category
 * @param {number} userId - User ID
 * @param {string} period - Optional period filter
 * @returns {Promise<Array>} Category breakdown
 */
async function getSpendingByCategory(userId, period = null) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const targetPeriod = period || currentMonth;
  
  let dateFilter = '';
  const params = [userId];
  
  if (targetPeriod) {
    dateFilter = 'AND strftime("%Y-%m", t.transaction_date) = ?';
    params.push(targetPeriod);
  }
  
  // Get all transactions and decrypt to calculate category breakdown
  const allTx = await getSpendingAnalytics(userId, { period: targetPeriod });
  
  // Group by category
  const categoryMap = new Map();
  
  allTx.transactions.forEach(tx => {
    const key = tx.category_id || 'others';
    const existing = categoryMap.get(key) || {
      category_id: tx.category_id,
      category_name: tx.category_name,
      icon: tx.icon,
      total: 0,
      count: 0
    };
    
    existing.total += tx.amount;
    existing.count += 1;
    categoryMap.set(key, existing);
  });
  
  const breakdown = Array.from(categoryMap.values())
    .sort((a, b) => b.total - a.total);
  
  const grandTotal = breakdown.reduce((sum, cat) => sum + cat.total, 0);
  
  return breakdown.map(cat => ({
    ...cat,
    percentage: grandTotal > 0 ? (cat.total / grandTotal) * 100 : 0
  }));
}

/**
 * Get weekly spending trend with previous week comparison
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Weekly trend data with comparison
 */
async function getWeeklyTrend(userId) {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(now.getDate() - 14);
  
  // Get transactions from last 14 days (current week + previous week)
  const sql = `
    SELECT 
      DATE(t.transaction_date) as date,
      t.amount_encrypted
    FROM Transactions t
    WHERE t.user_id = ? 
      AND t.transaction_date >= ?
    ORDER BY t.transaction_date ASC
  `;
  
  const rows = await query(sql, [userId, formatDateKey(fourteenDaysAgo)]);
  
  // Group by date and decrypt
  const dailyMap = new Map();
  
  rows.forEach(row => {
    const date = row.date;
    const amount = parseFloat(encryptionService.decrypt(row.amount_encrypted));
    dailyMap.set(date, (dailyMap.get(date) || 0) + amount);
  });
  
  // Build array for last 7 days (current week)
  const currentWeek = [];
  let currentWeekTotal = 0;
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateKey = formatDateKey(d);
    const amount = dailyMap.get(dateKey) || 0;
    currentWeek.push({
      date: dateKey,
      amount: amount
    });
    currentWeekTotal += amount;
  }
  
  // Build array for previous 7 days (previous week)
  const previousWeek = [];
  let previousWeekTotal = 0;
  for (let i = 13; i >= 7; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateKey = formatDateKey(d);
    const amount = dailyMap.get(dateKey) || 0;
    previousWeek.push({
      date: dateKey,
      amount: amount
    });
    previousWeekTotal += amount;
  }
  
  // Calculate percentage change
  let percentageChange = 0;
  if (previousWeekTotal > 0) {
    percentageChange = ((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100;
  } else if (currentWeekTotal > 0) {
    // If no previous week data but current week has data, show as 100% increase
    percentageChange = 100;
  }
  
  return {
    currentWeek: currentWeek,
    previousWeek: previousWeek,
    currentWeekTotal: currentWeekTotal,
    previousWeekTotal: previousWeekTotal,
    percentageChange: percentageChange
  };
}

/**
 * Get historical spending averages for baseline comparison
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Historical averages (daily, weekly, monthly)
 */
async function getHistoricalAverages(userId) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(now.getDate() - 60);
  
  // Get transactions from last 60 days for better average calculation
  const sql = `
    SELECT 
      DATE(t.transaction_date) as date,
      t.amount_encrypted
    FROM Transactions t
    WHERE t.user_id = ? 
      AND t.transaction_date >= ?
    ORDER BY t.transaction_date ASC
  `;
  
  const rows = await query(sql, [userId, formatDateKey(sixtyDaysAgo)]);
  
  if (rows.length === 0) {
    return {
      dailyAverage: 0,
      weeklyAverage: 0,
      monthlyAverage: 0,
      hasEnoughData: false
    };
  }
  
  // Decrypt and group by date
  const dailyMap = new Map();
  rows.forEach(row => {
    const date = row.date;
    const amount = parseFloat(encryptionService.decrypt(row.amount_encrypted));
    dailyMap.set(date, (dailyMap.get(date) || 0) + amount);
  });
  
  const dailyAmounts = Array.from(dailyMap.values());
  const totalAmount = dailyAmounts.reduce((sum, amt) => sum + amt, 0);
  const daysWithTransactions = dailyMap.size;
  
  // Calculate averages
  const dailyAverage = daysWithTransactions > 0 ? totalAmount / daysWithTransactions : 0;
  const weeklyAverage = dailyAverage * 7;
  const monthlyAverage = dailyAverage * 30;
  
  // Check if we have enough data (at least 7 days of transactions)
  const hasEnoughData = daysWithTransactions >= 7;
  
  return {
    dailyAverage: Math.round(dailyAverage * 100) / 100,
    weeklyAverage: Math.round(weeklyAverage * 100) / 100,
    monthlyAverage: Math.round(monthlyAverage * 100) / 100,
    totalDays: daysWithTransactions,
    totalAmount: totalAmount,
    hasEnoughData: hasEnoughData
  };
}

module.exports = {
  getSpendingAnalytics,
  getSpendingSummary,
  getSpendingByCategory,
  getWeeklyTrend,
  getHistoricalAverages
};
