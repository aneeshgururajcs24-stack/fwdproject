import React from 'react';

const TransactionList = ({ transactions, onDelete, onEdit, currencySymbol = '$' }) => {
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
      <div className="transaction-list-header">
        <h2>Transactions</h2>
        {transactions.length > 0 && (
          <span className="transaction-count">{transactions.length} transaction{transactions.length !== 1 ? 's' : ''}</span>
        )}
      </div>
      {transactions.length === 0 ? (
        <p className="no-transactions">No transactions found. Try adjusting your filters.</p>
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
                  {transaction.type === 'income' ? '+' : '-'}{currencySymbol}{transaction.amount.toFixed(2)}
                </span>
                <button
                  onClick={() => onEdit(transaction)}
                  className="btn-edit"
                  aria-label="Edit transaction"
                >
                  Edit
                </button>
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
