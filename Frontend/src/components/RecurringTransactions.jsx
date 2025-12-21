import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { recurringTransactionAPI } from '../api';

const CATEGORIES = {
  income: [
    { value: 'Salary', label: '💰 Salary' },
    { value: 'Freelance', label: '💼 Freelance' },
    { value: 'Business', label: '🏢 Business' },
    { value: 'Investment', label: '📈 Investment' },
    { value: 'Other Income', label: '💵 Other Income' },
  ],
  expense: [
    { value: 'Rent', label: '🏠 Rent' },
    { value: 'Utilities', label: '💡 Utilities' },
    { value: 'Subscriptions', label: '📱 Subscriptions' },
    { value: 'Insurance', label: '🛡️ Insurance' },
    { value: 'Loan Payment', label: '🏦 Loan Payment' },
    { value: 'Other Expense', label: '💸 Other Expense' },
  ],
};

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const RecurringTransactions = ({ currencySymbol = '$' }) => {
  const [recurringTransactions, setRecurringTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense',
    category: '',
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    isActive: true,
  });

  useEffect(() => {
    fetchRecurringTransactions();
  }, []);

  const fetchRecurringTransactions = async () => {
    try {
      const response = await recurringTransactionAPI.getAll();
      setRecurringTransactions(response.data);
    } catch (err) {
      console.error('Failed to fetch recurring transactions:', err);
      toast.error('Failed to load recurring transactions');
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: inputType === 'checkbox' ? checked : value,
      ...(name === 'type' && { category: '' }), // Reset category when type changes
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const transaction = {
      description: formData.description,
      amount: parseFloat(formData.amount),
      type: formData.type,
      category: formData.category,
      frequency: formData.frequency,
      start_date: new Date(formData.startDate).toISOString(),
      is_active: formData.isActive,
    };

    try {
      if (editingId) {
        await recurringTransactionAPI.update(editingId, transaction);
        toast.success('Recurring transaction updated!');
      } else {
        await recurringTransactionAPI.create(transaction);
        toast.success('Recurring transaction added!');
      }
      await fetchRecurringTransactions();
      resetForm();
    } catch (err) {
      console.error('Failed to save recurring transaction:', err);
      toast.error('Failed to save recurring transaction');
    }
  };

  const handleEdit = (transaction) => {
    setFormData({
      description: transaction.description,
      amount: transaction.amount.toString(),
      type: transaction.type,
      category: transaction.category,
      frequency: transaction.frequency,
      startDate: transaction.start_date?.split('T')[0] || new Date().toISOString().split('T')[0],
      isActive: transaction.is_active,
    });
    setEditingId(transaction._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this recurring transaction?')) {
      return;
    }
    try {
      await recurringTransactionAPI.delete(id);
      toast.success('Recurring transaction deleted!');
      await fetchRecurringTransactions();
    } catch (err) {
      console.error('Failed to delete recurring transaction:', err);
      toast.error('Failed to delete recurring transaction');
    }
  };

  const toggleActive = async (id) => {
    const transaction = recurringTransactions.find(t => t._id === id);
    if (!transaction) return;

    try {
      await recurringTransactionAPI.update(id, { is_active: !transaction.is_active });
      toast.success('Status updated!');
      await fetchRecurringTransactions();
    } catch (err) {
      console.error('Failed to toggle status:', err);
      toast.error('Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      type: 'expense',
      category: '',
      frequency: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      isActive: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const getNextOccurrence = (startDate, frequency) => {
    if (!startDate) return new Date();
    const start = new Date(startDate);
    const today = new Date();

    switch (frequency) {
      case 'daily':
        return new Date(today.getTime() + 86400000);
      case 'weekly':
        return new Date(today.getTime() + 7 * 86400000);
      case 'monthly':
        return new Date(today.getFullYear(), today.getMonth() + 1, start.getDate());
      case 'yearly':
        return new Date(today.getFullYear() + 1, start.getMonth(), start.getDate());
      default:
        return today;
    }
  };

  const getMonthlyTotal = () => {
    const monthlyIncome = recurringTransactions
      .filter(t => t.type === 'income' && t.is_active && t.frequency === 'monthly')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpense = recurringTransactions
      .filter(t => t.type === 'expense' && t.is_active && t.frequency === 'monthly')
      .reduce((sum, t) => sum + t.amount, 0);

    return { monthlyIncome, monthlyExpense, net: monthlyIncome - monthlyExpense };
  };

  const monthlyTotals = getMonthlyTotal();

  return (
    <div className="recurring-container">
      <div className="recurring-header">
        <h2>Recurring Transactions</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-add-recurring"
        >
          {showForm ? '✕ Cancel' : '➕ Add Recurring'}
        </button>
      </div>

      {/* Monthly Summary */}
      <div className="recurring-summary">
        <div className="recurring-summary-card income">
          <span className="summary-label">Monthly Income</span>
          <span className="summary-value">{currencySymbol}{monthlyTotals.monthlyIncome.toFixed(2)}</span>
        </div>
        <div className="recurring-summary-card expense">
          <span className="summary-label">Monthly Expenses</span>
          <span className="summary-value">{currencySymbol}{monthlyTotals.monthlyExpense.toFixed(2)}</span>
        </div>
        <div className={`recurring-summary-card net ${monthlyTotals.net >= 0 ? 'positive' : 'negative'}`}>
          <span className="summary-label">Net Monthly</span>
          <span className="summary-value">{currencySymbol}{monthlyTotals.net.toFixed(2)}</span>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="recurring-form-container">
          <h3>{editingId ? 'Edit Recurring Transaction' : 'Add Recurring Transaction'}</h3>
          <form onSubmit={handleSubmit} className="recurring-form">
            <div className="form-row">
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="e.g., Monthly rent, Netflix subscription"
                  required
                />
              </div>
              <div className="form-group">
                <label>Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleFormChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Type</label>
                <select name="type" value={formData.type} onChange={handleFormChange} required>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div className="form-group">
                <label>Category</label>
                <select name="category" value={formData.category} onChange={handleFormChange} required>
                  <option value="">Select category...</option>
                  {CATEGORIES[formData.type].map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Frequency</label>
                <select name="frequency" value={formData.frequency} onChange={handleFormChange} required>
                  {FREQUENCIES.map((freq) => (
                    <option key={freq.value} value={freq.value}>{freq.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleFormChange}
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit">
                {editingId ? 'Update' : 'Add'} Recurring Transaction
              </button>
              <button type="button" onClick={resetForm} className="btn-cancel">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recurring Transactions List */}
      <div className="recurring-list">
        {recurringTransactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔄</div>
            <h3>No Recurring Transactions</h3>
            <p>Add recurring income or expenses to track your regular financial obligations</p>
          </div>
        ) : (
          <div className="recurring-grid">
            {recurringTransactions.map((transaction) => (
              <div key={transaction._id} className={`recurring-card ${transaction.type} ${!transaction.is_active ? 'inactive' : ''}`}>
                <div className="recurring-card-header">
                  <div className="recurring-info">
                    <h4>{transaction.description}</h4>
                    <span className="recurring-category">{transaction.category}</span>
                  </div>
                  <div className={`recurring-amount ${transaction.type}`}>
                    {transaction.type === 'income' ? '+' : '-'}{currencySymbol}{transaction.amount.toFixed(2)}
                  </div>
                </div>

                <div className="recurring-details">
                  <div className="recurring-detail-item">
                    <span className="detail-label">Frequency:</span>
                    <span className="detail-value">{transaction.frequency}</span>
                  </div>
                  <div className="recurring-detail-item">
                    <span className="detail-label">Next:</span>
                    <span className="detail-value">
                      {getNextOccurrence(transaction.start_date, transaction.frequency).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="recurring-detail-item">
                    <span className="detail-label">Status:</span>
                    <span className={`status-badge ${transaction.is_active ? 'active' : 'paused'}`}>
                      {transaction.is_active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                </div>

                <div className="recurring-actions">
                  <button onClick={() => toggleActive(transaction._id)} className="btn-toggle">
                    {transaction.is_active ? '⏸️ Pause' : '▶️ Resume'}
                  </button>
                  <button onClick={() => handleEdit(transaction)} className="btn-edit">
                    ✏️ Edit
                  </button>
                  <button onClick={() => handleDelete(transaction._id)} className="btn-delete">
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecurringTransactions;
