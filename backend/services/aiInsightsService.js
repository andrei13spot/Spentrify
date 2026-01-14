/**
 * AI Insights Service
 * 
 * Generates AI-powered insights based on transaction analysis.
 * Implements UC-3: Auto-Audit & Habit Analysis features.
 */

const { query, run } = require('../database/connection');
const analyticsService = require('./analyticsService');
const encryptionService = require('./encryption');
const mlInsightsService = require('./mlInsightsService');

/**
 * Generate and store AI insights for a user
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Generated insights
 */
async function generateInsights(userId) {
  const insights = [];
  
  // Use ML-based insights (learns from user's actual data)
  try {
    const mlInsights = await mlInsightsService.generateMLInsights(userId);
    insights.push(...mlInsights);
  } catch (error) {
    console.error('ML insights generation failed, falling back to rule-based:', error);
    // Fallback to rule-based if ML fails
    const fallbackInsights = await generateFallbackInsights(userId);
    insights.push(...fallbackInsights);
  }
  
  // Store insights in database
  for (const insight of insights) {
    await storeInsight(userId, insight.type, insight.message);
  }
  
  return insights;
}

/**
 * Fallback rule-based insights (used if ML fails or insufficient data)
 */
async function generateFallbackInsights(userId) {
  const insights = [];
  
  // 1. Get current month transactions
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const analytics = await analyticsService.getSpendingAnalytics(userId, { period: currentMonth });
  
  // 2. Get category breakdown
  const categoryBreakdown = await analyticsService.getSpendingByCategory(userId, currentMonth);
  
  // 3. Get weekly trend
  const weeklyTrend = await analyticsService.getWeeklyTrend(userId);
  
  // 4. Get all transactions for pattern detection
  const allTx = await analyticsService.getSpendingAnalytics(userId);
  
  // INSIGHT 1: Overspending Alerts
  const overspendingInsights = await detectOverspending(userId, analytics, categoryBreakdown);
  insights.push(...overspendingInsights);
  
  // INSIGHT 2: Habit Patterns
  const habitInsights = await detectHabitPatterns(userId, allTx.transactions);
  insights.push(...habitInsights);
  
  // INSIGHT 3: Duplicate Subscription Detection
  const subscriptionInsights = await detectDuplicateSubscriptions(userId, allTx.transactions);
  insights.push(...subscriptionInsights);
  
  // INSIGHT 4: Projected Monthly Spending
  const projectionInsight = await projectMonthlySpending(userId, analytics, weeklyTrend);
  if (projectionInsight) insights.push(projectionInsight);
  
  // INSIGHT 5: Category-specific alerts
  const categoryAlerts = await detectCategorySpikes(userId, categoryBreakdown, weeklyTrend);
  insights.push(...categoryAlerts);
  
  return insights;
}

/**
 * Detect overspending patterns
 */
async function detectOverspending(userId, analytics, categoryBreakdown) {
  const insights = [];
  
  // Check if user has budgets
  const budgets = await query(
    'SELECT * FROM Budgets WHERE user_id = ?',
    [userId]
  );
  
  for (const budget of budgets) {
    const budgetAmount = parseFloat(encryptionService.decrypt(budget.target_amount_encrypted));
    const categoryId = budget.category_id;
    
    let spent = 0;
    if (categoryId) {
      const catData = categoryBreakdown.find(c => c.category_id === categoryId);
      spent = catData ? catData.total : 0;
    } else {
      spent = analytics.total;
    }
    
    if (spent > budgetAmount) {
      const overAmount = spent - budgetAmount;
      insights.push({
        type: 'Overspending',
        message: `You've exceeded your ${categoryId ? 'category' : 'overall'} budget by ₱${overAmount.toLocaleString()}. Current spending: ₱${spent.toLocaleString()}.`
      });
    }
  }
  
  return insights;
}

/**
 * Detect habit patterns (e.g., frequent dining out, coffee habits)
 */
async function detectHabitPatterns(userId, transactions) {
  const insights = [];
  
  // Group transactions by merchant
  const merchantMap = new Map();
  transactions.forEach(tx => {
    const merchant = tx.merchant_name || 'Unknown';
    const existing = merchantMap.get(merchant) || { count: 0, total: 0, dates: [] };
    existing.count += 1;
    existing.total += tx.amount;
    existing.dates.push(tx.date);
    merchantMap.set(merchant, existing);
  });
  
  // Find frequent merchants (visited 3+ times in last 30 days)
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  
  for (const [merchant, data] of merchantMap.entries()) {
    const recentDates = data.dates.filter(d => new Date(d) >= thirtyDaysAgo);
    if (recentDates.length >= 3) {
      const avgAmount = data.total / data.count;
      insights.push({
        type: 'Habit',
        message: `You've visited ${merchant} ${recentDates.length} times in the last 30 days, spending an average of ₱${avgAmount.toLocaleString()} per visit.`
      });
    }
  }
  
  return insights;
}

/**
 * Detect duplicate subscriptions
 */
async function detectDuplicateSubscriptions(userId, transactions) {
  const insights = [];
  
  const subscriptionKeywords = ['netflix', 'spotify', 'youtube', 'premium', 'subscription', 'monthly', 'disney', 'hbo', 'amazon prime'];
  
  // Find subscription-like transactions
  const subscriptions = transactions.filter(tx => {
    const merchant = (tx.merchant_name || '').toLowerCase();
    return subscriptionKeywords.some(keyword => merchant.includes(keyword));
  });
  
  // Group by merchant name (case-insensitive)
  const subMap = new Map();
  subscriptions.forEach(tx => {
    const key = (tx.merchant_name || 'Unknown').toLowerCase();
    const existing = subMap.get(key) || [];
    existing.push(tx);
    subMap.set(key, existing);
  });
  
  // Check for price changes or duplicates
  for (const [merchant, txs] of subMap.entries()) {
    if (txs.length >= 2) {
      // Check for price increase
      const amounts = txs.map(tx => tx.amount).sort((a, b) => b - a);
      const latest = amounts[0];
      const previous = amounts[1];
      
      if (latest > previous) {
        const increase = latest - previous;
        insights.push({
          type: 'Subscription',
          message: `${merchant.charAt(0).toUpperCase() + merchant.slice(1)} price increased by ₱${increase.toLocaleString()} this month.`
        });
      }
    }
  }
  
  return insights;
}

/**
 * Project monthly spending based on current trend
 */
async function projectMonthlySpending(userId, analytics, weeklyTrend) {
  if (weeklyTrend.length < 3) return null;
  
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysElapsed = now.getDate();
  
  // Calculate average daily spending from weekly trend
  const totalWeekly = weeklyTrend.reduce((sum, day) => sum + day.amount, 0);
  const avgDaily = totalWeekly / weeklyTrend.length;
  
  // Project for remaining month
  const projected = analytics.total + (avgDaily * (daysInMonth - daysElapsed));
  
  return {
    type: 'Projection',
    message: `Based on your current spending pattern, you're projected to spend ₱${Math.round(projected).toLocaleString()} this month.`
  };
}

/**
 * Detect category spending spikes
 */
async function detectCategorySpikes(userId, categoryBreakdown, weeklyTrend) {
  const insights = [];
  
  // Find top spending category
  if (categoryBreakdown.length > 0) {
    const topCategory = categoryBreakdown[0];
    const weeklyTotal = weeklyTrend.reduce((sum, day) => sum + day.amount, 0);
    
    // Estimate category's weekly share
    const categoryWeeklyEstimate = (topCategory.total / 30) * 7; // Rough estimate
    
    if (categoryWeeklyEstimate > 3000) { // Threshold: ₱3,000 per week
      insights.push({
        type: 'Category Alert',
        message: `${topCategory.category_name} spending is higher this week. You've spent ₱${Math.round(categoryWeeklyEstimate).toLocaleString()} on ${topCategory.category_name.toLowerCase()} in the last 7 days.`
      });
    }
  }
  
  return insights;
}

/**
 * Store insight in database
 */
async function storeInsight(userId, insightType, message) {
  // Check if similar insight already exists (avoid duplicates)
  const existing = await query(
    'SELECT * FROM AI_Insights WHERE user_id = ? AND insight_type = ? AND message = ? AND is_read = 0',
    [userId, insightType, message]
  );
  
  if (existing.length === 0) {
    await run(
      'INSERT INTO AI_Insights (user_id, insight_type, message, is_read) VALUES (?, ?, ?, 0)',
      [userId, insightType, message]
    );
  }
}

/**
 * Get unread insights for a user
 * @param {number} userId - User ID
 * @param {number} limit - Maximum number of insights to return
 * @returns {Promise<Array>} Unread insights
 */
async function getUnreadInsights(userId, limit = 10) {
  const insights = await query(
    'SELECT * FROM AI_Insights WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC LIMIT ?',
    [userId, limit]
  );
  
  return insights.map(row => ({
    id: row.insight_id,
    type: row.insight_type,
    message: row.message,
    createdAt: row.created_at,
    isRead: row.is_read === 1
  }));
}

/**
 * Mark insight as read
 */
async function markAsRead(userId, insightId) {
  await run(
    'UPDATE AI_Insights SET is_read = 1 WHERE insight_id = ? AND user_id = ?',
    [insightId, userId]
  );
}

module.exports = {
  generateInsights,
  getUnreadInsights,
  markAsRead
};
