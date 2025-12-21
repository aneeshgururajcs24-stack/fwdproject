import React from 'react';

const Summary = ({ summary }) => {
  return (
    <div className="summary">
      <h2>Financial Summary</h2>
      <div className="summary-grid">
        <div className="summary-card income">
          <h3>Total Income</h3>
          <p className="amount">${summary.total_income.toFixed(2)}</p>
        </div>
        <div className="summary-card expense">
          <h3>Total Expenses</h3>
          <p className="amount">${summary.total_expense.toFixed(2)}</p>
        </div>
        <div className={`summary-card balance ${summary.balance >= 0 ? 'positive' : 'negative'}`}>
          <h3>Balance</h3>
          <p className="amount">${summary.balance.toFixed(2)}</p>
        </div>
        <div className="summary-card count">
          <h3>Transactions</h3>
          <p className="amount">{summary.transaction_count}</p>
        </div>
      </div>
    </div>
  );
};

export default Summary;
