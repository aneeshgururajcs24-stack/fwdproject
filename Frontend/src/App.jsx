import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { transactionAPI, authAPI, setAuthToken, getAuthToken } from './api';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import Summary from './components/Summary';
import SearchFilter from './components/SearchFilter';
import Auth from './components/Auth';
import Charts from './components/Charts';
import Navigation from './components/Navigation';
import Settings from './components/Settings';
import RecurringTransactions from './components/RecurringTransactions';
import Goals from './components/Goals';
import './App.css';
import './components/recurring-goals.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    total_income: 0,
    total_expense: 0,
    balance: 0,
    transaction_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('currency') || 'USD';
  });
  const [activePage, setActivePage] = useState('summary');
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const response = await authAPI.getCurrentUser();
          setUser(response.data);
          setIsAuthenticated(true);
        } catch (err) {
          setAuthToken(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  const loadData = async () => {
    await Promise.all([fetchTransactions(), fetchSummary()]);
  };

  const fetchTransactions = async () => {
    try {
      const response = await transactionAPI.getAll();
      setTransactions(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch transactions');
      console.error(err);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await transactionAPI.getSummary();
      setSummary(response.data);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  };

  const handleLogin = async (email, password, name = null, isLogin = true) => {
    try {
      let response;
      if (isLogin) {
        console.log('Attempting login...');
        response = await authAPI.login({ email, password });
        console.log('Login successful');
      } else {
        console.log('Attempting registration...');
        await authAPI.register({ email, password, name });
        toast.success('Account created successfully!');
        console.log('Registration successful, logging in...');
        response = await authAPI.login({ email, password });
        console.log('Login after registration successful');
      }

      setAuthToken(response.data.access_token);

      const userResponse = await authAPI.getCurrentUser();
      setUser(userResponse.data);
      setIsAuthenticated(true);

      if (isLogin) {
        toast.success(`Welcome back, ${userResponse.data.name}!`);
      }
    } catch (err) {
      console.error('handleLogin error:', err);
      const errorMsg = err.response?.data?.detail || 'An error occurred';
      toast.error(errorMsg);
      throw err;
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setIsAuthenticated(false);
    setUser(null);
    setTransactions([]);
    setSummary({
      total_income: 0,
      total_expense: 0,
      balance: 0,
      transaction_count: 0,
    });
    toast.success('Logged out successfully');
  };

  const handleAddTransaction = async (transaction) => {
    try {
      await transactionAPI.create(transaction);
      await Promise.all([fetchTransactions(), fetchSummary()]);
      setError(null);
      toast.success(`${transaction.type === 'income' ? 'Income' : 'Expense'} added successfully!`);
    } catch (err) {
      const errorMsg = 'Failed to add transaction';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error(err);
    }
  };

  const handleUpdateTransaction = async (id, transaction) => {
    try {
      await transactionAPI.update(id, transaction);
      await Promise.all([fetchTransactions(), fetchSummary()]);
      setError(null);
      setEditingTransaction(null);
      toast.success('Transaction updated successfully!');
    } catch (err) {
      const errorMsg = 'Failed to update transaction';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error(err);
    }
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setDateFilter('all');
    toast.success('Filters cleared');
  };

  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency);
    toast.success(`Currency changed to ${getCurrencyName(newCurrency)}`);
  };

  const getCurrencySymbol = (currencyCode) => {
    const symbols = {
      USD: '$',
      INR: '₹',
      EUR: '€',
      JPY: '¥',
      NPR: 'रू'
    };
    return symbols[currencyCode] || '$';
  };

  const getCurrencyName = (currencyCode) => {
    const names = {
      USD: 'US Dollar',
      INR: 'Indian Rupee',
      EUR: 'Euro',
      JPY: 'Japanese Yen',
      NPR: 'Nepali Rupee'
    };
    return names[currencyCode] || 'US Dollar';
  };

  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
    toast.success(`Dark mode ${!darkMode ? 'enabled' : 'disabled'}`);
  };

  const handleUpdateUser = async (newUsername) => {
    try {
      const response = await authAPI.updateProfile({ name: newUsername });
      setUser(response.data);
      toast.success('Username updated successfully!');
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to update username';
      toast.error(errorMsg);
      console.error(err);
    }
  };

  const handleChangePassword = async (currentPassword, newPassword) => {
    try {
      await authAPI.changePassword({ current_password: currentPassword, new_password: newPassword });
      toast.success('Password changed successfully!');
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to change password';
      toast.error(errorMsg);
      console.error(err);
    }
  };

  const getFilteredTransactions = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions.filter(transaction => {
      const matchesSearch =
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filterType === 'all' || transaction.type === filterType;

      let matchesDate = true;
      const transactionDate = new Date(transaction.date);

      if (dateFilter === 'month') {
        matchesDate =
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear;
      } else if (dateFilter === 'last-month') {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        matchesDate =
          transactionDate.getMonth() === lastMonth &&
          transactionDate.getFullYear() === lastMonthYear;
      } else if (dateFilter === '30days') {
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        matchesDate = transactionDate >= thirtyDaysAgo;
      }

      return matchesSearch && matchesType && matchesDate;
    });
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      await transactionAPI.delete(id);
      await Promise.all([fetchTransactions(), fetchSummary()]);
      setError(null);
      toast.success('Transaction deleted successfully');
    } catch (err) {
      const errorMsg = 'Failed to delete transaction';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Toaster position="top-right" reverseOrder={false} />
        <Auth onLogin={handleLogin} />
      </>
    );
  }

  return (
    <>
      <Navigation activePage={activePage} setActivePage={setActivePage} />
      <div className="app">
        <Toaster position="top-right" reverseOrder={false} />
        <header>
          <div className="header-content">
            <h1>BudgetO</h1>
            <div className="user-info">
              <span>Welcome, {user?.name}!</span>
              <button onClick={handleLogout} className="btn-logout">
                Logout
              </button>
            </div>
          </div>
        </header>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <main className="container">
        {activePage === 'summary' && (
          <Summary
            summary={summary}
            transactions={transactions}
            currencySymbol={getCurrencySymbol(currency)}
            onAddTransaction={handleAddTransaction}
          />
        )}

        {activePage === 'charts' && (
          <Charts transactions={transactions} currencySymbol={getCurrencySymbol(currency)} />
        )}

        {activePage === 'add-transaction' && (
          <TransactionForm
            onSubmit={handleAddTransaction}
            onUpdate={handleUpdateTransaction}
            editingTransaction={editingTransaction}
            onCancelEdit={handleCancelEdit}
          />
        )}

        {activePage === 'transactions' && (
          <>
            <SearchFilter
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filterType={filterType}
              onFilterTypeChange={setFilterType}
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
              onClearFilters={handleClearFilters}
            />
            <TransactionList
              transactions={getFilteredTransactions()}
              onDelete={handleDeleteTransaction}
              onEdit={handleEditTransaction}
              currencySymbol={getCurrencySymbol(currency)}
            />
          </>
        )}

        {activePage === 'recurring' && (
          <RecurringTransactions
            currencySymbol={getCurrencySymbol(currency)}
          />
        )}

        {activePage === 'goals' && (
          <Goals
            currencySymbol={getCurrencySymbol(currency)}
          />
        )}

        {activePage === 'settings' && (
          <Settings
            user={user}
            darkMode={darkMode}
            currency={currency}
            onToggleDarkMode={handleToggleDarkMode}
            onUpdateUser={handleUpdateUser}
            onChangePassword={handleChangePassword}
            onChangeCurrency={handleCurrencyChange}
          />
        )}
      </main>
      </div>
    </>
  );
}

export default App;
