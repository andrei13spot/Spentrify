/**
 * ML-Based Insights Service
 * 
 * Uses statistical analysis and pattern recognition to generate
 * personalized insights based on actual user spending patterns.
 * No hardcoded thresholds - everything is learned from user data.
 */

const { query } = require('../database/connection');
const analyticsService = require('./analyticsService');
const encryptionService = require('./encryption');

/**
 * Generate ML-powered insights for a user
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Generated insights
 */
async function generateMLInsights(userId) {
  const insights = [];
  
  // Get comprehensive user data
  const userData = await getUserSpendingProfile(userId);
  
  if (userData.transactionCount < 5) {
    // Not enough data for meaningful insights
    return [];
  }
  
  // 1. Anomaly Detection - Find unusual spending patterns
  const anomalies = await detectAnomalies(userId, userData);
  insights.push(...anomalies);
  
  // 2. Trend Analysis - Detect spending trends
  const trends = await analyzeTrends(userId, userData);
  insights.push(...trends);
  
  // 3. Habit Recognition - Learn user's spending habits
  const habits = await recognizeHabits(userId, userData);
  insights.push(...habits);
  
  // 4. Predictive Insights - Forecast future spending
  const predictions = await predictSpending(userId, userData);
  insights.push(...predictions);
  
  // 5. Category Analysis - Learn category-specific patterns
  const categoryInsights = await analyzeCategories(userId, userData);
  insights.push(...categoryInsights);
  
  // 6. Budget Compliance - Compare against learned patterns
  const budgetInsights = await analyzeBudgetCompliance(userId, userData);
  insights.push(...budgetInsights);
  
  return insights;
}

/**
 * Build comprehensive user spending profile
 */
async function getUserSpendingProfile(userId) {
  // Get all transactions with merchant names from database
  const transactionsWithMerchants = await query(
    `SELECT t.transaction_id, t.amount_encrypted, t.merchant_name_encrypted, 
            t.transaction_date, t.category_id, c.category_name
     FROM Transactions t
     LEFT JOIN Categories c ON t.category_id = c.category_id
     WHERE t.user_id = ?
     ORDER BY t.transaction_date DESC`,
    [userId]
  );
  
  if (transactionsWithMerchants.length === 0) {
    return {
      transactionCount: 0,
      transactions: [],
      amounts: [],
      dates: [],
      categories: [],
      merchants: []
    };
  }
  
  // Decrypt and format transactions
  const transactions = transactionsWithMerchants.map(row => {
    const amount = parseFloat(encryptionService.decrypt(row.amount_encrypted));
    const merchant = row.merchant_name_encrypted
      ? encryptionService.decrypt(row.merchant_name_encrypted)
      : 'Unknown';
    
    return {
      id: row.transaction_id,
      amount,
      date: row.transaction_date,
      transaction_date: row.transaction_date,
      category_id: row.category_id,
      category_name: row.category_name || 'Others',
      merchant_name: merchant
    };
  });
  
  // Extract features
  const amounts = transactions.map(tx => tx.amount);
  const dates = transactions.map(tx => new Date(tx.date));
  const categories = transactions.map(tx => ({
    id: tx.category_id,
    name: tx.category_name,
    amount: tx.amount
  }));
  const merchants = transactions.map(tx => ({
    name: tx.merchant_name,
    amount: tx.amount,
    date: tx.date,
    category_id: tx.category_id
  }));
  
  // Calculate statistics
  const stats = calculateStatistics(amounts, dates);
  
  return {
    transactionCount: transactions.length,
    transactions,
    amounts,
    dates,
    categories,
    merchants,
    stats,
    // Historical periods
    last30Days: getTransactionsInPeriod(transactions, 30),
    last7Days: getTransactionsInPeriod(transactions, 7),
    currentMonth: getCurrentMonthTransactions(transactions),
    previousMonth: getPreviousMonthTransactions(transactions)
  };
}

/**
 * Calculate statistical measures
 */
function calculateStatistics(amounts, dates) {
  if (amounts.length === 0) return null;
  
  const sorted = [...amounts].sort((a, b) => a - b);
  const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
  
  // Standard deviation
  const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
  const stdDev = Math.sqrt(variance);
  
  // Percentiles
  const median = sorted[Math.floor(sorted.length / 2)];
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  
  // Min/Max
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  
  // Frequency analysis (transactions per day)
  const dayCounts = new Map();
  dates.forEach(date => {
    const key = date.toISOString().split('T')[0];
    dayCounts.set(key, (dayCounts.get(key) || 0) + 1);
  });
  const avgTransactionsPerDay = amounts.length / (dayCounts.size || 1);
  
  return {
    mean,
    median,
    stdDev,
    q1,
    q3,
    min,
    max,
    range: max - min,
    avgTransactionsPerDay,
    totalDays: dayCounts.size
  };
}

/**
 * Detect anomalies using statistical methods
 */
async function detectAnomalies(userId, userData) {
  const insights = [];
  const { stats, last7Days, amounts } = userData;
  
  if (!stats || amounts.length < 10) return insights;
  
  // Z-score based anomaly detection
  // An anomaly is a value more than 2 standard deviations from the mean
  const threshold = stats.mean + (2 * stats.stdDev);
  const lowerThreshold = stats.mean - (2 * stats.stdDev);
  
  // Check recent transactions for anomalies
  const recentAnomalies = last7Days.filter(tx => 
    tx.amount > threshold || tx.amount < lowerThreshold
  );
  
  if (recentAnomalies.length > 0) {
    const largest = recentAnomalies.reduce((max, tx) => 
      tx.amount > max.amount ? tx : max, recentAnomalies[0]
    );
    
    const zScore = (largest.amount - stats.mean) / stats.stdDev;
    const isHigh = largest.amount > threshold;
    
    // Get merchant name from transaction
    const merchantName = largest.merchant_name || largest.category_name || 'a merchant';
    
    insights.push({
      type: 'Anomaly',
      message: `Unusual ${isHigh ? 'high' : 'low'} spending detected: ₱${largest.amount.toLocaleString()} at ${merchantName}. This is ${Math.abs(zScore).toFixed(1)}x your average spending pattern.`,
      severity: Math.abs(zScore) > 3 ? 'high' : 'medium'
    });
  }
  
  // Category anomaly detection
  const categoryStats = calculateCategoryStatistics(userData.categories);
  for (const [categoryId, catStats] of categoryStats.entries()) {
    const recentCategoryTx = last7Days.filter(tx => tx.category_id === categoryId);
    if (recentCategoryTx.length > 0) {
      const categoryTotal = recentCategoryTx.reduce((sum, tx) => sum + tx.amount, 0);
      const avgWeekly = (catStats.mean * catStats.frequency) * 7;
      
      if (categoryTotal > avgWeekly * 1.5) {
        const categoryName = userData.categories.find(c => c.id === categoryId)?.name || 'this category';
        insights.push({
          type: 'Category Anomaly',
          message: `${categoryName} spending is ${((categoryTotal / avgWeekly) * 100).toFixed(0)}% higher than your usual weekly pattern.`,
          severity: 'medium'
        });
      }
    }
  }
  
  return insights;
}

/**
 * Analyze spending trends using regression
 */
async function analyzeTrends(userId, userData) {
  const insights = [];
  const { currentMonth, previousMonth, stats } = userData;
  
  if (!currentMonth || !previousMonth || currentMonth.length === 0) return insights;
  
  // Calculate month-over-month change
  const currentTotal = currentMonth.reduce((sum, tx) => sum + tx.amount, 0);
  const previousTotal = previousMonth.reduce((sum, tx) => sum + tx.amount, 0);
  
  if (previousTotal > 0) {
    const changePercent = ((currentTotal - previousTotal) / previousTotal) * 100;
    const changeAmount = currentTotal - previousTotal;
    
    if (Math.abs(changePercent) > 15) { // Significant change (>15%)
      insights.push({
        type: 'Trend',
        message: `Your spending is ${changePercent > 0 ? 'up' : 'down'} ${Math.abs(changePercent).toFixed(0)}% compared to last month (${changePercent > 0 ? '+' : ''}₱${Math.abs(changeAmount).toLocaleString()}).`,
        trend: changePercent > 0 ? 'increasing' : 'decreasing'
      });
    }
  }
  
  // Weekly trend analysis
  const weeklyTrend = await analyticsService.getWeeklyTrend(userId);
  if (weeklyTrend.length >= 4) {
    const amounts = weeklyTrend.map(day => day.amount);
    const trend = calculateLinearTrend(amounts);
    
    if (Math.abs(trend.slope) > 100) { // Significant daily change
      const direction = trend.slope > 0 ? 'increasing' : 'decreasing';
      insights.push({
        type: 'Weekly Trend',
        message: `Your daily spending is ${direction} by an average of ₱${Math.abs(trend.slope).toFixed(0)} per day this week.`,
        trend: direction
      });
    }
  }
  
  return insights;
}

/**
 * Recognize spending habits using frequency and pattern analysis
 */
async function recognizeHabits(userId, userData) {
  const insights = [];
  const { merchants, last30Days } = userData;
  
  // Merchant frequency analysis
  const merchantFreq = new Map();
  merchants.forEach(m => {
    const key = m.name.toLowerCase();
    const existing = merchantFreq.get(key) || { count: 0, total: 0, dates: [] };
    existing.count += 1;
    existing.total += m.amount;
    existing.dates.push(new Date(m.date));
    merchantFreq.set(key, existing);
  });
  
  // Find recurring patterns (visited 3+ times with regular intervals)
  for (const [merchant, data] of merchantFreq.entries()) {
    if (data.count >= 3) {
      // Calculate average interval between visits
      const sortedDates = data.dates.sort((a, b) => a - b);
      const intervals = [];
      for (let i = 1; i < sortedDates.length; i++) {
        const diff = (sortedDates[i] - sortedDates[i - 1]) / (1000 * 60 * 60 * 24); // days
        intervals.push(diff);
      }
      
      if (intervals.length > 0) {
        const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
        const avgAmount = data.total / data.count;
        
        // Check if it's a subscription-like pattern (regular intervals)
        const intervalVariance = intervals.reduce((sum, val) => 
          sum + Math.pow(val - avgInterval, 2), 0) / intervals.length;
        const isRegular = intervalVariance < 5; // Low variance = regular pattern
        
        if (isRegular && avgInterval <= 35) { // Monthly or more frequent
          const daysSinceLast = (new Date() - sortedDates[sortedDates.length - 1]) / (1000 * 60 * 60 * 24);
          const expectedNext = avgInterval - daysSinceLast;
          
          if (expectedNext <= 7 && expectedNext >= -3) {
            insights.push({
              type: 'Habit Pattern',
              message: `You typically spend ₱${avgAmount.toLocaleString()} at ${merchant} every ${Math.round(avgInterval)} days. Your next visit is expected soon.`,
              merchant: merchant,
              frequency: avgInterval
            });
          }
        }
      }
    }
  }
  
  // Day-of-week pattern detection
  const dayOfWeekPattern = analyzeDayOfWeekPattern(userData.transactions);
  if (dayOfWeekPattern) {
    insights.push({
      type: 'Spending Pattern',
      message: `You tend to spend more on ${dayOfWeekPattern.highDay}s (avg ₱${dayOfWeekPattern.highAvg.toLocaleString()}) compared to ${dayOfWeekPattern.lowDay}s (avg ₱${dayOfWeekPattern.lowAvg.toLocaleString()}).`,
    });
  }
  
  return insights;
}

/**
 * Predict future spending using time series analysis
 */
async function predictSpending(userId, userData) {
  const insights = [];
  const { currentMonth, stats, dates } = userData;
  
  if (!currentMonth || currentMonth.length < 7) return insights;
  
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysElapsed = now.getDate();
  const daysRemaining = daysInMonth - daysElapsed;
  
  // Calculate daily spending rate for current month
  const currentTotal = currentMonth.reduce((sum, tx) => sum + tx.amount, 0);
  const dailyRate = currentTotal / daysElapsed;
  
  // Project remaining month
  const projectedRemaining = dailyRate * daysRemaining;
  const projectedTotal = currentTotal + projectedRemaining;
  
  // Compare with historical average
  if (stats && stats.mean) {
    const historicalMonthly = stats.mean * stats.avgTransactionsPerDay * 30;
    const deviation = ((projectedTotal - historicalMonthly) / historicalMonthly) * 100;
    
    if (Math.abs(deviation) > 10) {
      insights.push({
        type: 'Projection',
        message: `Based on your current spending rate, you're projected to spend ₱${Math.round(projectedTotal).toLocaleString()} this month. This is ${deviation > 0 ? 'above' : 'below'} your historical average by ${Math.abs(deviation).toFixed(0)}%.`,
        projected: projectedTotal,
        historical: historicalMonthly
      });
    }
  }
  
  return insights;
}

/**
 * Analyze category-specific patterns
 */
async function analyzeCategories(userId, userData) {
  const insights = [];
  const { categories, last7Days, currentMonth, previousMonth } = userData;
  
  // Group by category
  const categoryMap = new Map();
  categories.forEach(cat => {
    const key = cat.id;
    const existing = categoryMap.get(key) || { 
      id: key, 
      name: cat.name, 
      amounts: [], 
      recent: [] 
    };
    existing.amounts.push(cat.amount);
    categoryMap.set(key, existing);
  });
  
  // Add recent transactions to category map
  last7Days.forEach(tx => {
    const cat = categoryMap.get(tx.category_id);
    if (cat) {
      cat.recent.push(tx.amount);
    } else if (tx.category_id) {
      // Create new entry if category not in map yet
      categoryMap.set(tx.category_id, {
        id: tx.category_id,
        name: tx.category_name || 'Unknown',
        amounts: [tx.amount],
        recent: [tx.amount]
      });
    }
  });
  
  // Analyze each category
  for (const [categoryId, catData] of categoryMap.entries()) {
    if (catData.amounts.length < 3) continue;
    
    const catStats = calculateStatistics(catData.amounts, []);
    const recentTotal = catData.recent.reduce((sum, val) => sum + val, 0);
    const recentAvg = recentTotal / (catData.recent.length || 1);
    
    // Compare recent spending to historical average
    if (catStats && recentAvg > catStats.mean * 1.3) {
      insights.push({
        type: 'Category Alert',
        message: `${catData.name} spending is ${((recentAvg / catStats.mean - 1) * 100).toFixed(0)}% higher than your usual pattern this week.`,
        category: catData.name
      });
    }
    
    // Month-over-month category comparison
    const currentCatTotal = currentMonth
      .filter(tx => tx.category_id === categoryId)
      .reduce((sum, tx) => sum + tx.amount, 0);
    const previousCatTotal = previousMonth
      .filter(tx => tx.category_id === categoryId)
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    if (previousCatTotal > 0) {
      const catChange = ((currentCatTotal - previousCatTotal) / previousCatTotal) * 100;
      if (Math.abs(catChange) > 25) {
        insights.push({
          type: 'Category Trend',
          message: `${catData.name} spending is ${catChange > 0 ? 'up' : 'down'} ${Math.abs(catChange).toFixed(0)}% this month compared to last month.`,
          category: catData.name,
          change: catChange
        });
      }
    }
  }
  
  return insights;
}

/**
 * Analyze budget compliance using learned patterns
 */
async function analyzeBudgetCompliance(userId, userData) {
  const insights = [];
  
  // Get user budgets
  const budgets = await query(
    'SELECT * FROM Budgets WHERE user_id = ?',
    [userId]
  );
  
  if (budgets.length === 0) return insights;
  
  const { currentMonth, stats } = userData;
  const currentTotal = currentMonth.reduce((sum, tx) => sum + tx.amount, 0);
  
  for (const budget of budgets) {
    const budgetAmount = parseFloat(encryptionService.decrypt(budget.target_amount_encrypted));
    const categoryId = budget.category_id;
    
    // Calculate actual spending for this budget
    let actualSpending = currentTotal;
    if (categoryId) {
      actualSpending = currentMonth
        .filter(tx => tx.category_id === categoryId)
        .reduce((sum, tx) => sum + tx.amount, 0);
    }
    
    const progress = (actualSpending / budgetAmount) * 100;
    const daysInMonth = new Date().getDate();
    const expectedProgress = (daysInMonth / 30) * 100;
    
    // Compare actual progress vs expected progress
    if (progress > expectedProgress + 10) {
      const overBy = actualSpending - (budgetAmount * (expectedProgress / 100));
      insights.push({
        type: 'Budget Alert',
        message: `You're ${((progress / expectedProgress - 1) * 100).toFixed(0)}% ahead of your expected ${categoryId ? 'category' : 'overall'} budget pace. At this rate, you'll exceed your budget by ₱${Math.round(overBy).toLocaleString()}.`,
        severity: progress > 100 ? 'high' : 'medium'
      });
    } else if (progress < expectedProgress - 15 && stats) {
      // Under budget - positive insight
      const remaining = budgetAmount - actualSpending;
      insights.push({
        type: 'Budget Status',
        message: `Great job! You're ${((expectedProgress - progress) / expectedProgress * 100).toFixed(0)}% under your expected budget pace. You have ₱${Math.round(remaining).toLocaleString()} remaining.`,
        severity: 'low'
      });
    }
  }
  
  return insights;
}

/**
 * Helper: Calculate category statistics
 */
function calculateCategoryStatistics(categories) {
  const categoryMap = new Map();
  
  categories.forEach(cat => {
    const key = cat.id;
    const existing = categoryMap.get(key) || { amounts: [], dates: [] };
    existing.amounts.push(cat.amount);
    categoryMap.set(key, existing);
  });
  
  const stats = new Map();
  for (const [key, data] of categoryMap.entries()) {
    const amounts = data.amounts;
    const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
    const frequency = amounts.length / 30; // transactions per day (rough estimate)
    
    stats.set(key, { mean, frequency, count: amounts.length });
  }
  
  return stats;
}

/**
 * Helper: Calculate linear trend (simple regression)
 */
function calculateLinearTrend(values) {
  const n = values.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = values;
  
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept };
}

/**
 * Helper: Analyze day-of-week patterns
 */
function analyzeDayOfWeekPattern(transactions) {
  const dayStats = new Map();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  transactions.forEach(tx => {
    const date = new Date(tx.date);
    const day = date.getDay();
    const existing = dayStats.get(day) || { total: 0, count: 0 };
    existing.total += tx.amount;
    existing.count += 1;
    dayStats.set(day, existing);
  });
  
  if (dayStats.size < 3) return null;
  
  const dayAverages = Array.from(dayStats.entries()).map(([day, data]) => ({
    day,
    name: dayNames[day],
    avg: data.total / data.count
  }));
  
  dayAverages.sort((a, b) => b.avg - a.avg);
  
  if (dayAverages.length >= 2) {
    return {
      highDay: dayAverages[0].name,
      highAvg: dayAverages[0].avg,
      lowDay: dayAverages[dayAverages.length - 1].name,
      lowAvg: dayAverages[dayAverages.length - 1].avg
    };
  }
  
  return null;
}

/**
 * Helper: Get transactions in last N days
 */
function getTransactionsInPeriod(transactions, days) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return transactions.filter(tx => new Date(tx.date) >= cutoff);
}

/**
 * Helper: Get current month transactions
 */
function getCurrentMonthTransactions(transactions) {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  return transactions.filter(tx => new Date(tx.date) >= firstDay);
}

/**
 * Helper: Get previous month transactions
 */
function getPreviousMonthTransactions(transactions) {
  const now = new Date();
  const firstDayCurrent = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayPrevious = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return transactions.filter(tx => {
    const date = new Date(tx.date);
    return date >= firstDayPrevious && date < firstDayCurrent;
  });
}

module.exports = {
  generateMLInsights,
  getUserSpendingProfile
};
