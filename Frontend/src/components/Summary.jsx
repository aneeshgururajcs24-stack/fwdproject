import React, { useState } from 'react';

const CATEGORIES = {
  income: [
    { value: 'Salary', label: '💰 Salary' },
    { value: 'Freelance', label: '💼 Freelance' },
    { value: 'Business', label: '🏢 Business' },
    { value: 'Investment', label: '📈 Investment' },
    { value: 'Gift', label: '🎁 Gift' },
    { value: 'Other Income', label: '💵 Other Income' },
    { value: 'custom', label: '✏️ Custom...' },
  ],
  expense: [
    { value: 'Food', label: '🍔 Food' },
    { value: 'Transport', label: '🚗 Transport' },
    { value: 'Rent', label: '🏠 Rent' },
    { value: 'Utilities', label: '💡 Utilities' },
    { value: 'Entertainment', label: '🎮 Entertainment' },
    { value: 'Shopping', label: '🛍️ Shopping' },
    { value: 'Healthcare', label: '⚕️ Healthcare' },
    { value: 'Education', label: '📚 Education' },
    { value: 'Other Expense', label: '💸 Other Expense' },
    { value: 'custom', label: '✏️ Custom...' },
  ],
};

const Summary = ({ summary, transactions = [], currencySymbol = '$', onAddTransaction }) => {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [quickFormData, setQuickFormData] = useState({
    description: '',
    amount: '',
    type: 'expense',
    category: '',
    date: new Date().toISOString().split('T')[0],
  });
  const getRecentTransactions = () => {
    return [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  };

  const getMonthlyComparison = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const lastMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    });

    const currentIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentExpense = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const lastIncome = lastMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const lastExpense = lastMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      current: { income: currentIncome, expense: currentExpense },
      last: { income: lastIncome, expense: lastExpense }
    };
  };

  const getTopCategories = () => {
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const categoryTotals = {};

    expenseTransactions.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    return Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));
  };

  const getQuickStats = () => {
    if (transactions.length === 0) return null;

    const amounts = transactions.map(t => t.amount);
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const expenseTransactions = transactions.filter(t => t.type === 'expense');

    const avgTransaction = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    const largestIncome = incomeTransactions.length > 0
      ? Math.max(...incomeTransactions.map(t => t.amount))
      : 0;
    const largestExpense = expenseTransactions.length > 0
      ? Math.max(...expenseTransactions.map(t => t.amount))
      : 0;

    return {
      avgTransaction,
      largestIncome,
      largestExpense
    };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleQuickFormChange = (e) => {
    const { name, value } = e.target;

    if (name === 'category' && value === 'custom') {
      setShowCustomCategory(true);
      setQuickFormData(prev => ({
        ...prev,
        category: ''
      }));
    } else if (name === 'category') {
      setShowCustomCategory(false);
      setQuickFormData(prev => ({
        ...prev,
        [name]: value
      }));
    } else if (name === 'type') {
      setShowCustomCategory(false);
      setQuickFormData(prev => ({
        ...prev,
        type: value,
        category: ''
      }));
    } else {
      setQuickFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    const transaction = {
      description: quickFormData.description,
      amount: parseFloat(quickFormData.amount),
      type: quickFormData.type,
      category: quickFormData.category,
      date: new Date(quickFormData.date).toISOString(),
    };
    onAddTransaction(transaction);
    setQuickFormData({
      description: '',
      amount: '',
      type: 'expense',
      category: '',
      date: new Date().toISOString().split('T')[0],
    });
    setShowCustomCategory(false);
    setShowQuickAdd(false);
  };

  const recentTransactions = getRecentTransactions();
  const monthlyComparison = getMonthlyComparison();
  const topCategories = getTopCategories();
  const quickStats = getQuickStats();

  return (
    <div className="summary">
      <h2>Financial Summary</h2>

      {/* Quick Add Transaction */}
      <div className="quick-add-section">
        <button
          onClick={() => setShowQuickAdd(!showQuickAdd)}
          className="btn-quick-add"
        >
          {showQuickAdd ? '✕ Close' : '➕ Quick Add Transaction'}
        </button>

        {showQuickAdd && (
          <form onSubmit={handleQuickSubmit} className="quick-add-form">
            <div className="quick-form-row">
              <input
                type="text"
                name="description"
                value={quickFormData.description}
                onChange={handleQuickFormChange}
                placeholder="Description"
                required
                className="quick-input"
              />
              <input
                type="number"
                name="amount"
                value={quickFormData.amount}
                onChange={handleQuickFormChange}
                placeholder="Amount"
                step="0.01"
                min="0.01"
                required
                className="quick-input"
              />
            </div>
            <div className="quick-form-row">
              <select
                name="type"
                value={quickFormData.type}
                onChange={handleQuickFormChange}
                required
                className="quick-input"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              {!showCustomCategory ? (
                <select
                  name="category"
                  value={quickFormData.category}
                  onChange={handleQuickFormChange}
                  required
                  className="quick-input category-select"
                >
                  <option value="">Select category...</option>
                  {CATEGORIES[quickFormData.type].map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  name="category"
                  value={quickFormData.category}
                  onChange={handleQuickFormChange}
                  placeholder="Enter custom category"
                  required
                  className="quick-input"
                  autoFocus
                />
              )}
              <input
                type="date"
                name="date"
                value={quickFormData.date}
                onChange={handleQuickFormChange}
                required
                className="quick-input"
              />
            </div>
            <button type="submit" className="btn-quick-submit">
              Add Transaction
            </button>
          </form>
        )}
      </div>

      {/* Main Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card income">
          <h3>Total Income</h3>
          <p className="amount">{currencySymbol}{summary.total_income.toFixed(2)}</p>
        </div>
        <div className="summary-card expense">
          <h3>Total Expenses</h3>
          <p className="amount">{currencySymbol}{summary.total_expense.toFixed(2)}</p>
        </div>
        <div className={`summary-card balance ${summary.balance >= 0 ? 'positive' : 'negative'}`}>
          <h3>Balance</h3>
          <p className="amount">{currencySymbol}{summary.balance.toFixed(2)}</p>
        </div>
        <div className="summary-card count">
          <h3>Transactions</h3>
          <p className="amount">{summary.transaction_count}</p>
        </div>
      </div>

      {/* Quick Statistics */}
      {quickStats && (
        <div className="stats-section">
          <h3>Quick Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Average Transaction</span>
              <span className="stat-value">{currencySymbol}{quickStats.avgTransaction.toFixed(2)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Largest Income</span>
              <span className="stat-value income-color">{currencySymbol}{quickStats.largestIncome.toFixed(2)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Largest Expense</span>
              <span className="stat-value expense-color">{currencySymbol}{quickStats.largestExpense.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Comparison */}
      <div className="monthly-comparison">
        <h3>Monthly Comparison</h3>
        <div className="comparison-grid">
          <div className="comparison-card">
            <h4>This Month</h4>
            <div className="comparison-row">
              <span>Income:</span>
              <span className="income-color">{currencySymbol}{monthlyComparison.current.income.toFixed(2)}</span>
            </div>
            <div className="comparison-row">
              <span>Expenses:</span>
              <span className="expense-color">{currencySymbol}{monthlyComparison.current.expense.toFixed(2)}</span>
            </div>
            <div className="comparison-row total">
              <span>Net:</span>
              <span className={monthlyComparison.current.income - monthlyComparison.current.expense >= 0 ? 'income-color' : 'expense-color'}>
                {currencySymbol}{(monthlyComparison.current.income - monthlyComparison.current.expense).toFixed(2)}
              </span>
            </div>
          </div>
          <div className="comparison-card">
            <h4>Last Month</h4>
            <div className="comparison-row">
              <span>Income:</span>
              <span className="income-color">{currencySymbol}{monthlyComparison.last.income.toFixed(2)}</span>
            </div>
            <div className="comparison-row">
              <span>Expenses:</span>
              <span className="expense-color">{currencySymbol}{monthlyComparison.last.expense.toFixed(2)}</span>
            </div>
            <div className="comparison-row total">
              <span>Net:</span>
              <span className={monthlyComparison.last.income - monthlyComparison.last.expense >= 0 ? 'income-color' : 'expense-color'}>
                {currencySymbol}{(monthlyComparison.last.income - monthlyComparison.last.expense).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Spending Categories */}
      {topCategories.length > 0 && (
        <div className="top-categories">
          <h3>Top Spending Categories</h3>
          <div className="categories-list">
            {topCategories.map((cat, index) => (
              <div key={index} className="category-item">
                <div className="category-info">
                  <span className="category-rank">#{index + 1}</span>
                  <span className="category-name">{cat.category}</span>
                </div>
                <span className="category-amount">{currencySymbol}{cat.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <div className="recent-transactions">
          <h3>Recent Transactions</h3>
          <div className="recent-list">
            {recentTransactions.map((transaction) => (
              <div key={transaction._id} className={`recent-item ${transaction.type}`}>
                <div className="recent-info">
                  <span className="recent-description">{transaction.description}</span>
                  <span className="recent-date">{formatDate(transaction.date)}</span>
                </div>
                <span className={`recent-amount ${transaction.type}`}>
                  {transaction.type === 'income' ? '+' : '-'}{currencySymbol}{transaction.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Summary;
