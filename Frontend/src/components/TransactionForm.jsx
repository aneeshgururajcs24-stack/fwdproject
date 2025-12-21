import React, { useState, useEffect } from 'react';

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

const TransactionForm = ({ onSubmit, onUpdate, editingTransaction, onCancelEdit }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense',
    category: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  useEffect(() => {
    if (editingTransaction) {
      const categoryExists = CATEGORIES[editingTransaction.type].some(
        cat => cat.value === editingTransaction.category
      );
      setFormData({
        description: editingTransaction.description,
        amount: editingTransaction.amount.toString(),
        type: editingTransaction.type,
        category: categoryExists ? editingTransaction.category : 'custom',
        date: new Date(editingTransaction.date).toISOString().split('T')[0],
      });
      setShowCustomCategory(!categoryExists);
    }
  }, [editingTransaction]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'category' && value === 'custom') {
      setShowCustomCategory(true);
      setFormData(prev => ({
        ...prev,
        category: ''
      }));
    } else if (name === 'category') {
      setShowCustomCategory(false);
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    } else if (name === 'type') {
      setShowCustomCategory(false);
      setFormData(prev => ({
        ...prev,
        type: value,
        category: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const transaction = {
      description: formData.description,
      amount: parseFloat(formData.amount),
      type: formData.type,
      category: formData.category,
      date: new Date(formData.date).toISOString(),
    };

    if (editingTransaction) {
      onUpdate(editingTransaction._id, transaction);
    } else {
      onSubmit(transaction);
    }

    setFormData({
      description: '',
      amount: '',
      type: 'expense',
      category: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const handleCancel = () => {
    setFormData({
      description: '',
      amount: '',
      type: 'expense',
      category: '',
      date: new Date().toISOString().split('T')[0],
    });
    onCancelEdit();
  };

  return (
    <div className="transaction-form">
      <h2>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <input
            type="text"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            placeholder="e.g., Grocery shopping"
          />
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount</label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
          />
        </div>

        <div className="form-group">
          <label htmlFor="type">Type</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          {!showCustomCategory ? (
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="category-select"
            >
              <option value="">Select a category...</option>
              {CATEGORIES[formData.type].map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              placeholder="Enter custom category"
              autoFocus
            />
          )}
        </div>

        <div className="form-group">
          <label htmlFor="date">Date</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-buttons">
          <button type="submit" className="btn-submit">
            {editingTransaction ? 'Update Transaction' : 'Add Transaction'}
          </button>
          {editingTransaction && (
            <button type="button" onClick={handleCancel} className="btn-cancel">
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;
