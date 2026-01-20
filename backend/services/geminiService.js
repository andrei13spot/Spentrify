const fetch = require('node-fetch');
const analyticsService = require('./analyticsService');

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-US');
}

async function generateSummary(userId) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const analytics = await analyticsService.getSpendingAnalytics(userId, { period: currentMonth });
  const categoryBreakdown = await analyticsService.getSpendingByCategory(userId, currentMonth);
  const weeklyTrend = await analyticsService.getWeeklyTrend(userId);

  const topCategories = categoryBreakdown.slice(0, 3).map((cat) => ({
    name: cat.category_name,
    total: formatNumber(cat.total),
  }));

  const prompt = [
    'You are a finance assistant. Summarize user spending habits in 1-2 sentences.',
    'Use PHP currency and ONLY the provided data. Do not invent numbers.',
    'Data:',
    JSON.stringify(
      {
        period: currentMonth,
        total_spent_php: formatNumber(analytics.total),
        transaction_count: analytics.transactionCount,
        top_categories: topCategories,
        weekly_trend: {
          current_week_total_php: formatNumber(weeklyTrend.currentWeekTotal),
          previous_week_total_php: formatNumber(weeklyTrend.previousWeekTotal),
          percentage_change: Math.round(weeklyTrend.percentageChange || 0),
        },
      },
      null,
      2
    ),
  ].join('\n');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 120,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${errorText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  return text ? String(text).trim() : null;
}

async function generateInsightDetail({
  userId,
  insightType,
  insightMessage,
  context,
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const analytics = await analyticsService.getSpendingAnalytics(userId, { period: currentMonth });
  const categoryBreakdown = await analyticsService.getSpendingByCategory(userId, currentMonth);
  const weeklyTrend = await analyticsService.getWeeklyTrend(userId);

  const topCategories = categoryBreakdown.slice(0, 3).map((cat) => ({
    name: cat.category_name,
    total: formatNumber(cat.total),
  }));

  const prompt = [
    'You are a finance assistant. Create action points and recommendations.',
    'Use PHP currency and ONLY the provided data. Do not invent numbers.',
    'Return JSON with keys: summary, action_points (array), recommendations (array).',
    'Make action points and recommendations specific to the data.',
    'Data:',
    JSON.stringify(
      {
        insight_type: insightType,
        insight_message: insightMessage,
        period: currentMonth,
        total_spent_php: formatNumber(analytics.total),
        transaction_count: analytics.transactionCount,
        top_categories: topCategories,
        weekly_trend: {
          current_week_total_php: formatNumber(weeklyTrend.currentWeekTotal),
          previous_week_total_php: formatNumber(weeklyTrend.previousWeekTotal),
          percentage_change: Math.round(weeklyTrend.percentageChange || 0),
        },
        context,
      },
      null,
      2
    ),
  ].join('\n');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 280,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${errorText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    return null;
  }

  try {
    const parsed = JSON.parse(String(text));
    return {
      summary: parsed.summary || insightMessage,
      actionPoints: Array.isArray(parsed.action_points) ? parsed.action_points : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    };
  } catch (error) {
    return {
      summary: String(text).trim(),
      actionPoints: [],
      recommendations: [],
    };
  }
}

module.exports = {
  generateSummary,
  generateInsightDetail,
};
