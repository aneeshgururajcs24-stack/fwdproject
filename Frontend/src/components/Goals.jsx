import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { goalAPI } from '../api';

const GOAL_CATEGORIES = [
  { value: 'emergency', label: '🆘 Emergency Fund', icon: '🆘' },
  { value: 'vacation', label: '✈️ Vacation', icon: '✈️' },
  { value: 'purchase', label: '🛍️ Major Purchase', icon: '🛍️' },
  { value: 'education', label: '📚 Education', icon: '📚' },
  { value: 'retirement', label: '🏖️ Retirement', icon: '🏖️' },
  { value: 'investment', label: '📈 Investment', icon: '📈' },
  { value: 'debt', label: '💳 Debt Payoff', icon: '💳' },
  { value: 'other', label: '🎯 Other', icon: '🎯' },
];

const Goals = ({ currencySymbol = '$' }) => {
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showContributeModal, setShowContributeModal] = useState(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    category: 'other',
    deadline: '',
    description: '',
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await goalAPI.getAll();
      setGoals(response.data);
    } catch (err) {
      console.error('Failed to fetch goals:', err);
      toast.error('Failed to load goals');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const goal = {
      name: formData.name,
      target_amount: parseFloat(formData.targetAmount),
      current_amount: parseFloat(formData.currentAmount || 0),
      category: formData.category,
      deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
      description: formData.description || null,
    };

    try {
      if (editingId) {
        await goalAPI.update(editingId, goal);
        toast.success('Goal updated!');
      } else {
        await goalAPI.create(goal);
        toast.success('Goal created!');
      }
      await fetchGoals();
      resetForm();
    } catch (err) {
      console.error('Failed to save goal:', err);
      toast.error('Failed to save goal');
    }
  };

  const handleContribute = async (goalId) => {
    const amount = parseFloat(contributeAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const goal = goals.find(g => g._id === goalId);
    if (!goal) return;

    const newAmount = Math.min(goal.current_amount + amount, goal.target_amount);

    try {
      await goalAPI.update(goalId, { current_amount: newAmount });
      if (newAmount >= goal.target_amount) {
        toast.success('🎉 Goal achieved! Congratulations!');
      } else {
        toast.success(`${currencySymbol}${amount.toFixed(2)} added to ${goal.name}!`);
      }
      await fetchGoals();
      setShowContributeModal(null);
      setContributeAmount('');
    } catch (err) {
      console.error('Failed to contribute to goal:', err);
      toast.error('Failed to add funds');
    }
  };

  const handleEdit = (goal) => {
    setFormData({
      name: goal.name,
      targetAmount: goal.target_amount.toString(),
      currentAmount: goal.current_amount.toString(),
      category: goal.category,
      deadline: goal.deadline ? goal.deadline.split('T')[0] : '',
      description: goal.description || '',
    });
    setEditingId(goal._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) {
      return;
    }
    try {
      await goalAPI.delete(id);
      toast.success('Goal deleted!');
      await fetchGoals();
    } catch (err) {
      console.error('Failed to delete goal:', err);
      toast.error('Failed to delete goal');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      targetAmount: '',
      currentAmount: '',
      category: 'other',
      deadline: '',
      description: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const getProgress = (goal) => {
    return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  };

  const getDaysRemaining = (deadline) => {
    if (!deadline) return null;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getTotalProgress = () => {
    if (goals.length === 0) return { saved: 0, target: 0, percentage: 0 };
    const saved = goals.reduce((sum, g) => sum + g.current_amount, 0);
    const target = goals.reduce((sum, g) => sum + g.target_amount, 0);
    return {
      saved,
      target,
      percentage: target > 0 ? (saved / target) * 100 : 0,
    };
  };

  const totalProgress = getTotalProgress();
  const achievedGoals = goals.filter(g => g.current_amount >= g.target_amount).length;

  return (
    <div className="goals-container">
      <div className="goals-header">
        <h2>Financial Goals</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-add-goal"
        >
          {showForm ? '✕ Cancel' : '➕ New Goal'}
        </button>
      </div>

      {/* Overall Progress */}
      {goals.length > 0 && (
        <div className="goals-overall">
          <h3>Overall Progress</h3>
          <div className="overall-stats">
            <div className="overall-stat">
              <span className="stat-label">Total Saved</span>
              <span className="stat-value income-color">{currencySymbol}{totalProgress.saved.toFixed(2)}</span>
            </div>
            <div className="overall-stat">
              <span className="stat-label">Total Target</span>
              <span className="stat-value">{currencySymbol}{totalProgress.target.toFixed(2)}</span>
            </div>
            <div className="overall-stat">
              <span className="stat-label">Goals Achieved</span>
              <span className="stat-value success-color">{achievedGoals} / {goals.length}</span>
            </div>
          </div>
          <div className="overall-progress-bar">
            <div
              className="overall-progress-fill"
              style={{ width: `${totalProgress.percentage}%` }}
            >
              <span className="progress-text">{totalProgress.percentage.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="goal-form-container">
          <h3>{editingId ? 'Edit Goal' : 'Create New Goal'}</h3>
          <form onSubmit={handleSubmit} className="goal-form">
            <div className="form-row">
              <div className="form-group">
                <label>Goal Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="e.g., Emergency Fund, New Car"
                  required
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select name="category" value={formData.category} onChange={handleFormChange} required>
                  {GOAL_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Target Amount</label>
                <input
                  type="number"
                  name="targetAmount"
                  value={formData.targetAmount}
                  onChange={handleFormChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label>Current Amount</label>
                <input
                  type="number"
                  name="currentAmount"
                  value={formData.currentAmount}
                  onChange={handleFormChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Deadline (Optional)</label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleFormChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description (Optional)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Add notes about this goal..."
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit">
                {editingId ? 'Update' : 'Create'} Goal
              </button>
              <button type="button" onClick={resetForm} className="btn-cancel">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goals List */}
      <div className="goals-list">
        {goals.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎯</div>
            <h3>No Goals Set</h3>
            <p>Create financial goals to track your progress and stay motivated!</p>
          </div>
        ) : (
          <div className="goals-grid">
            {goals.map((goal) => {
              const progress = getProgress(goal);
              const isAchieved = progress >= 100;
              const daysRemaining = getDaysRemaining(goal.deadline);
              const categoryIcon = GOAL_CATEGORIES.find(c => c.value === goal.category)?.icon || '🎯';

              return (
                <div key={goal._id} className={`goal-card ${isAchieved ? 'achieved' : ''}`}>
                  <div className="goal-card-header">
                    <div className="goal-icon">{categoryIcon}</div>
                    <div className="goal-title-section">
                      <h4>{goal.name}</h4>
                      <span className="goal-category">
                        {GOAL_CATEGORIES.find(c => c.value === goal.category)?.label}
                      </span>
                    </div>
                    {isAchieved && <div className="achievement-badge">🏆</div>}
                  </div>

                  {goal.description && (
                    <p className="goal-description">{goal.description}</p>
                  )}

                  <div className="goal-amounts">
                    <div className="amount-item">
                      <span className="amount-label">Current</span>
                      <span className="amount-value current">{currencySymbol}{goal.current_amount.toFixed(2)}</span>
                    </div>
                    <div className="amount-item">
                      <span className="amount-label">Target</span>
                      <span className="amount-value target">{currencySymbol}{goal.target_amount.toFixed(2)}</span>
                    </div>
                    <div className="amount-item">
                      <span className="amount-label">Remaining</span>
                      <span className="amount-value remaining">
                        {currencySymbol}{Math.max(0, goal.target_amount - goal.current_amount).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="goal-progress">
                    <div className="progress-bar">
                      <div
                        className={`progress-fill ${isAchieved ? 'complete' : ''}`}
                        style={{ width: `${progress}%` }}
                      >
                        <span className="progress-percentage">{progress.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  {daysRemaining !== null && (
                    <div className={`goal-deadline ${daysRemaining < 30 ? 'urgent' : ''}`}>
                      <span>⏰ {daysRemaining > 0 ? `${daysRemaining} days remaining` : daysRemaining === 0 ? 'Due today!' : `${Math.abs(daysRemaining)} days overdue`}</span>
                    </div>
                  )}

                  <div className="goal-actions">
                    {!isAchieved && (
                      <button
                        onClick={() => setShowContributeModal(goal._id)}
                        className="btn-contribute"
                      >
                        💰 Add Funds
                      </button>
                    )}
                    <button onClick={() => handleEdit(goal)} className="btn-edit">
                      ✏️ Edit
                    </button>
                    <button onClick={() => handleDelete(goal._id)} className="btn-delete">
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Contribute Modal */}
      {showContributeModal && (
        <div className="modal-overlay" onClick={() => setShowContributeModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add Funds</h3>
            <p>How much would you like to contribute?</p>
            <input
              type="number"
              value={contributeAmount}
              onChange={(e) => setContributeAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              className="contribute-input"
              autoFocus
            />
            <div className="modal-actions">
              <button
                onClick={() => handleContribute(showContributeModal)}
                className="btn-submit"
              >
                Add Funds
              </button>
              <button
                onClick={() => {
                  setShowContributeModal(null);
                  setContributeAmount('');
                }}
                className="btn-cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;
