import React from 'react';

const TransactionList = ({ transactions, onDelete }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="transaction-list">
      <h2>Transactions</h2>
      {transactions.length === 0 ? (
        <p className="no-transactions">No transactions yet. Add your first transaction above!</p>
      ) : (
        <div className="transactions">
          {transactions.map((transaction) => (
            <div
              key={transaction._id}
              className={`transaction-item ${transaction.type}`}
            >
              <div className="transaction-info">
                <h3>{transaction.description}</h3>
                <div className="transaction-details">
                  <span className="category">{transaction.category}</span>
                  <span className="date">{formatDate(transaction.date)}</span>
                </div>
              </div>
              <div className="transaction-actions">
                <span className={`amount ${transaction.type}`}>
                  {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                </span>
                <button
                  onClick={() => onDelete(transaction._id)}
                  className="btn-delete"
                  aria-label="Delete transaction"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionList;
