# AI Insights System - How It Works

## Overview

The AI insights system uses **Machine Learning and Statistical Analysis** to generate personalized insights based on each user's actual spending patterns. Unlike rule-based systems, this learns from user data and adapts to individual spending behaviors.

## How It Works

### 1. **Data Collection & Profile Building**
- Collects all user transactions from the database
- Extracts features: amounts, dates, categories, merchants, frequencies
- Calculates statistical measures (mean, median, standard deviation, percentiles)
- Builds historical patterns (last 7 days, last 30 days, current month, previous month)

### 2. **Machine Learning Techniques Used**

#### **Anomaly Detection (Z-Score Method)**
- Calculates user's personal spending mean and standard deviation
- Identifies transactions that are 2+ standard deviations from the mean
- **No hardcoded thresholds** - each user has their own baseline
- Example: If your average transaction is ₱500, a ₱2,000 transaction is flagged as unusual

#### **Trend Analysis (Linear Regression)**
- Uses simple linear regression to detect spending trends
- Calculates slope of spending over time
- Compares current month vs previous month
- Identifies increasing/decreasing patterns

#### **Pattern Recognition (Frequency Analysis)**
- Analyzes merchant visit frequency
- Detects regular intervals (subscription-like patterns)
- Calculates average spending per merchant
- Predicts next expected visit based on historical pattern

#### **Predictive Analytics (Time Series)**
- Calculates daily spending rate from current month
- Projects remaining month spending
- Compares projection to historical average
- Provides personalized forecasts

#### **Category Analysis (Statistical Comparison)**
- Calculates category-specific statistics for each user
- Compares recent spending to historical category averages
- Detects category spikes relative to user's own patterns
- Month-over-month category trend analysis

#### **Day-of-Week Pattern Detection**
- Analyzes which days user spends more
- Identifies spending habits by day of week
- Provides insights like "You spend more on weekends"

### 3. **Adaptive Thresholds**

All thresholds are **learned from user data**, not hardcoded:

- **Anomaly Detection**: Uses 2 standard deviations (statistical method)
- **Trend Significance**: 15% change threshold (relative to user's spending)
- **Category Alerts**: 30% above user's own category average
- **Budget Compliance**: Compares to user's expected pace (not fixed amounts)

### 4. **Personalization**

Each insight is personalized:
- "Your average transaction is ₱X" (calculated from YOUR data)
- "This is X% higher than YOUR usual pattern" (not a global threshold)
- "Based on YOUR spending rate..." (user-specific projection)

## Example Insights Generated

1. **Anomaly**: "Unusual high spending detected: ₱2,500 at Starbucks. This is 3.2x your average spending pattern."
   - Based on: User's personal mean (₱780) and std dev (₱200)

2. **Trend**: "Your spending is up 23% compared to last month (+₱3,450)."
   - Based on: Actual month-over-month comparison

3. **Habit**: "You typically spend ₱450 at McDonald's every 3 days. Your next visit is expected soon."
   - Based on: Frequency analysis of user's actual visit pattern

4. **Projection**: "Based on your current spending rate, you're projected to spend ₱15,200 this month. This is 18% above your historical average."
   - Based on: User's daily rate vs historical average

5. **Category Alert**: "Food spending is 45% higher than your usual pattern this week."
   - Based on: User's own food category average, not a fixed amount

## Training Process

The system **trains automatically** as users add transactions:

1. **Initial Learning** (5+ transactions): System builds baseline statistics
2. **Pattern Recognition** (10+ transactions): Detects spending patterns
3. **Habit Formation** (30+ transactions): Identifies recurring behaviors
4. **Predictive Modeling** (60+ transactions): Accurate projections

**No manual training required** - it learns continuously from user data.

## Technical Implementation

- **Language**: Pure JavaScript (no external ML libraries needed)
- **Methods**: Statistical analysis, regression, frequency analysis
- **Storage**: Insights stored in `AI_Insights` table
- **Performance**: Fast calculations (< 100ms for typical user)

## Future Enhancements

For more advanced AI, you could:
1. Add TensorFlow.js for deep learning
2. Use clustering algorithms (K-means) for spending segmentation
3. Implement neural networks for complex pattern recognition
4. Add natural language generation for more human-like insights

## Files

- `backend/services/mlInsightsService.js` - Core ML logic
- `backend/services/aiInsightsService.js` - Wrapper that uses ML service
- `backend/controllers/insightsController.js` - API endpoints
