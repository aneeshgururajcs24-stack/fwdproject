import React, { useState } from 'react';

const Navigation = ({ activePage, setActivePage }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handlePageChange = (page) => {
    setActivePage(page);
    setIsOpen(false); // Close sidebar on mobile after clicking
  };

  return (
    <>
      <button className="sidebar-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '✕' : '☰'}
      </button>
      <nav className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h3>Navigation</h3>
        </div>
        <div className="sidebar-links">
          <button
            onClick={() => handlePageChange('summary')}
            className={`sidebar-link ${activePage === 'summary' ? 'active' : ''}`}
          >
            <span className="link-icon">📊</span>
            <span className="link-text">Summary</span>
          </button>
          <button
            onClick={() => handlePageChange('charts')}
            className={`sidebar-link ${activePage === 'charts' ? 'active' : ''}`}
          >
            <span className="link-icon">📊</span>
            <span className="link-text">Analytics</span>
          </button>
          <button
            onClick={() => handlePageChange('add-transaction')}
            className={`sidebar-link ${activePage === 'add-transaction' ? 'active' : ''}`}
          >
            <span className="link-icon">➕</span>
            <span className="link-text">Add Transaction</span>
          </button>
          <button
            onClick={() => handlePageChange('transactions')}
            className={`sidebar-link ${activePage === 'transactions' ? 'active' : ''}`}
          >
            <span className="link-icon">📝</span>
            <span className="link-text">Transactions</span>
          </button>
          <button
            onClick={() => handlePageChange('recurring')}
            className={`sidebar-link ${activePage === 'recurring' ? 'active' : ''}`}
          >
            <span className="link-icon">🔄</span>
            <span className="link-text">Recurring</span>
          </button>
          <button
            onClick={() => handlePageChange('goals')}
            className={`sidebar-link ${activePage === 'goals' ? 'active' : ''}`}
          >
            <span className="link-icon">🎯</span>
            <span className="link-text">Goals</span>
          </button>
          <button
            onClick={() => handlePageChange('settings')}
            className={`sidebar-link ${activePage === 'settings' ? 'active' : ''}`}
          >
            <span className="link-icon">⚙️</span>
            <span className="link-text">Settings</span>
          </button>
        </div>
      </nav>
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)}></div>}
    </>
  );
};

export default Navigation;
