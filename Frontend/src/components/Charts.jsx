import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Charts = ({ transactions, currencySymbol = '$' }) => {
  const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'];

  const getCategoryData = () => {
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const categoryTotals = {};

    expenseTransactions.forEach(transaction => {
      const category = transaction.category;
      if (categoryTotals[category]) {
        categoryTotals[category] += transaction.amount;
      } else {
        categoryTotals[category] = transaction.amount;
      }
    });

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);
  };

  const getIncomeExpenseData = () => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return [
      { name: 'Income', amount: parseFloat(income.toFixed(2)) },
      { name: 'Expenses', amount: parseFloat(expense.toFixed(2)) }
    ];
  };

  const categoryData = getCategoryData();
  const incomeExpenseData = getIncomeExpenseData();

  if (transactions.length === 0) {
    return (
      <div className="charts-container">
        <h2>Analytics & Insights</h2>
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <h3>No Transaction Data Available</h3>
          <p>Start tracking your finances to see personalized insights and analytics!</p>
          <div className="empty-state-tips">
            <h4>What you'll see here once you add transactions:</h4>
            <ul>
              <li>📈 Financial health metrics and savings rate</li>
              <li>💡 Smart insights about your spending patterns</li>
              <li>💰 Personalized budget recommendations</li>
              <li>🎯 Category-specific money-saving tips</li>
              <li>📊 Visual charts of income vs expenses</li>
            </ul>
          </div>
          <p className="empty-state-action">
            Go to <strong>Add Transaction</strong> or <strong>Summary</strong> page to get started!
          </p>
        </div>
      </div>
    );
  }

  // Financial Analysis Functions
  const getFinancialAnalysis = () => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

    // Category analysis
    const expenseByCategory = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
    });
    const topExpenseCategory = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1])[0];

    // Calculate average transaction
    const avgTransaction = transactions.length > 0
      ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length
      : 0;

    return {
      income,
      expense,
      savingsRate,
      topExpenseCategory: topExpenseCategory || ['None', 0],
      avgTransaction,
      totalTransactions: transactions.length
    };
  };

  const getInsights = () => {
    const analysis = getFinancialAnalysis();
    const insights = [];

    // Savings insights
    if (analysis.savingsRate < 10) {
      insights.push({
        type: 'warning',
        title: 'Low Savings Rate',
        message: `Your savings rate is ${analysis.savingsRate.toFixed(1)}%. Financial experts recommend saving at least 20% of your income.`,
        icon: '⚠️'
      });
    } else if (analysis.savingsRate >= 20) {
      insights.push({
        type: 'success',
        title: 'Excellent Savings!',
        message: `You're saving ${analysis.savingsRate.toFixed(1)}% of your income. Keep up the great work!`,
        icon: '🎉'
      });
    } else {
      insights.push({
        type: 'info',
        title: 'Good Savings Progress',
        message: `You're saving ${analysis.savingsRate.toFixed(1)}% of your income. Try to increase this to 20% for better financial health.`,
        icon: '💡'
      });
    }

    // Spending insights
    if (analysis.topExpenseCategory[0] !== 'None') {
      const categoryPercent = (analysis.topExpenseCategory[1] / analysis.expense) * 100;
      if (categoryPercent > 40) {
        insights.push({
          type: 'warning',
          title: 'High Category Spending',
          message: `${analysis.topExpenseCategory[0]} accounts for ${categoryPercent.toFixed(1)}% of your expenses. Consider finding ways to reduce spending in this category.`,
          icon: '📊'
        });
      }
    }

    return insights;
  };

  const getRecommendations = () => {
    const analysis = getFinancialAnalysis();
    const recommendations = [];

    // Budget recommendations
    const recommended50_30_20 = {
      needs: analysis.income * 0.5,
      wants: analysis.income * 0.3,
      savings: analysis.income * 0.2
    };

    recommendations.push({
      title: '50/30/20 Budget Rule',
      description: 'A popular budgeting method: 50% for needs, 30% for wants, 20% for savings',
      items: [
        `Needs (50%): ${currencySymbol}${recommended50_30_20.needs.toFixed(2)}`,
        `Wants (30%): ${currencySymbol}${recommended50_30_20.wants.toFixed(2)}`,
        `Savings (20%): ${currencySymbol}${recommended50_30_20.savings.toFixed(2)}`
      ],
      icon: '💰'
    });

    // Money-saving tips
    recommendations.push({
      title: 'Money-Saving Tips',
      description: 'Practical strategies to reduce expenses and increase savings',
      items: [
        'Track all expenses to identify spending patterns',
        'Set up automatic transfers to savings account',
        'Review subscriptions and cancel unused services',
        'Cook at home more often instead of dining out',
        'Use the 24-hour rule for non-essential purchases',
        'Compare prices before making big purchases',
        'Build an emergency fund (3-6 months of expenses)'
      ],
      icon: '💡'
    });

    // Category-specific advice
    if (analysis.topExpenseCategory[0] !== 'None') {
      const category = analysis.topExpenseCategory[0];
      const categoryTips = {
        'Food': ['Plan meals weekly', 'Buy in bulk', 'Use coupons and cashback apps', 'Reduce food waste'],
        'Transport': ['Use public transportation', 'Carpool when possible', 'Maintain vehicle regularly', 'Consider fuel-efficient options'],
        'Shopping': ['Create shopping lists', 'Wait for sales', 'Avoid impulse purchases', 'Use price comparison tools'],
        'Entertainment': ['Look for free events', 'Use streaming services wisely', 'Take advantage of student/senior discounts', 'Host game nights at home'],
        'Utilities': ['Use energy-efficient appliances', 'Turn off lights when not needed', 'Adjust thermostat settings', 'Fix water leaks promptly']
      };

      if (categoryTips[category]) {
        recommendations.push({
          title: `${category} Savings Tips`,
          description: `Reduce spending in your top expense category: ${category}`,
          items: categoryTips[category],
          icon: '🎯'
        });
      }
    }

    return recommendations;
  };

  const analysis = getFinancialAnalysis();
  const insights = getInsights();
  const recommendations = getRecommendations();

  return (
    <div className="charts-container">
      <h2>Analytics & Insights</h2>

      {/* Financial Health Score */}
      <div className="financial-health-section">
        <h3>Financial Health Overview</h3>
        <div className="health-metrics">
          <div className="health-metric">
            <span className="metric-label">Savings Rate</span>
            <span className={`metric-value ${analysis.savingsRate >= 20 ? 'good' : analysis.savingsRate >= 10 ? 'moderate' : 'low'}`}>
              {analysis.savingsRate.toFixed(1)}%
            </span>
            <span className="metric-status">
              {analysis.savingsRate >= 20 ? 'Excellent' : analysis.savingsRate >= 10 ? 'Good' : 'Needs Improvement'}
            </span>
          </div>
          <div className="health-metric">
            <span className="metric-label">Income vs Expenses</span>
            <span className={`metric-value ${analysis.income > analysis.expense ? 'good' : 'low'}`}>
              {analysis.income > analysis.expense ? 'Positive' : 'Negative'}
            </span>
            <span className="metric-status">
              Net: {currencySymbol}{(analysis.income - analysis.expense).toFixed(2)}
            </span>
          </div>
          <div className="health-metric">
            <span className="metric-label">Total Transactions</span>
            <span className="metric-value">{analysis.totalTransactions}</span>
            <span className="metric-status">Tracked</span>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      {insights.length > 0 && (
        <div className="insights-section">
          <h3>Key Insights</h3>
          <div className="insights-grid">
            {insights.map((insight, index) => (
              <div key={index} className={`insight-card ${insight.type}`}>
                <div className="insight-header">
                  <span className="insight-icon">{insight.icon}</span>
                  <h4>{insight.title}</h4>
                </div>
                <p>{insight.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="recommendations-section">
          <h3>Personalized Recommendations</h3>
          <div className="recommendations-grid">
            {recommendations.map((rec, index) => (
              <div key={index} className="recommendation-card">
                <div className="recommendation-header">
                  <span className="recommendation-icon">{rec.icon}</span>
                  <h4>{rec.title}</h4>
                </div>
                <p className="recommendation-description">{rec.description}</p>
                <ul className="recommendation-list">
                  {rec.items.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Section */}
      <h3>Visual Analysis</h3>
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={incomeExpenseData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `${currencySymbol}${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="amount" fill="#667eea" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {categoryData.length > 0 && (
          <div className="chart-card">
            <h3>Expense Breakdown by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${currencySymbol}${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default Charts;
