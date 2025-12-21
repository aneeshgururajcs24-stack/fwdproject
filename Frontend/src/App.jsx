import React, { useState, useEffect } from 'react';
import { transactionAPI, authAPI, setAuthToken, getAuthToken } from './api';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import Summary from './components/Summary';
import Auth from './components/Auth';
import './App.css';

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
        console.log('Registration successful, logging in...');
        response = await authAPI.login({ email, password });
        console.log('Login after registration successful');
      }

      setAuthToken(response.data.access_token);

      const userResponse = await authAPI.getCurrentUser();
      setUser(userResponse.data);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('handleLogin error:', err);
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
  };

  const handleAddTransaction = async (transaction) => {
    try {
      await transactionAPI.create(transaction);
      await Promise.all([fetchTransactions(), fetchSummary()]);
      setError(null);
    } catch (err) {
      setError('Failed to add transaction');
      console.error(err);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      await transactionAPI.delete(id);
      await Promise.all([fetchTransactions(), fetchSummary()]);
      setError(null);
    } catch (err) {
      setError('Failed to delete transaction');
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
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <header>
        <div className="header-content">
          <h1>Finance Tracker</h1>
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
        <Summary summary={summary} />
        <TransactionForm onSubmit={handleAddTransaction} />
        <TransactionList
          transactions={transactions}
          onDelete={handleDeleteTransaction}
        />
      </main>
    </div>
  );
}

export default App;
