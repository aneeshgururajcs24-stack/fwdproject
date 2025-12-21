import React, { useState } from 'react';

const Settings = ({ user, darkMode, currency, onToggleDarkMode, onUpdateUser, onChangePassword, onChangeCurrency }) => {
  const [username, setUsername] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      onUpdateUser(username);
      setUsername('');
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters long!');
      return;
    }
    onChangePassword(currentPassword, newPassword);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="settings">
      <h2>Settings</h2>

      {/* User Information */}
      <div className="settings-section">
        <h3>User Information</h3>
        <div className="info-card">
          <div className="info-row">
            <span className="info-label">Current Username:</span>
            <span className="info-value">{user?.name}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Email:</span>
            <span className="info-value">{user?.email}</span>
          </div>
        </div>
      </div>

      {/* Change Username */}
      <div className="settings-section">
        <h3>Change Username</h3>
        <form onSubmit={handleUsernameSubmit} className="settings-form">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter new username"
            required
            minLength="1"
            maxLength="100"
            className="settings-input"
          />
          <button type="submit" className="btn-settings-save">
            Update Username
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="settings-section">
        <h3>Change Password</h3>
        <form onSubmit={handlePasswordSubmit} className="settings-form">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            required
            className="settings-input"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password (min 6 characters)"
            required
            minLength="6"
            className="settings-input"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
            minLength="6"
            className="settings-input"
          />
          <button type="submit" className="btn-settings-save">
            Change Password
          </button>
        </form>
      </div>

      {/* Appearance Settings */}
      <div className="settings-section">
        <h3>Appearance</h3>
        <div className="settings-toggle">
          <div className="toggle-info">
            <span className="toggle-label">Dark Mode</span>
            <span className="toggle-description">Switch to dark theme for better viewing at night</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={darkMode}
              onChange={onToggleDarkMode}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      {/* Currency Settings */}
      <div className="settings-section">
        <h3>Currency</h3>
        <div className="settings-form">
          <label htmlFor="currency-select" className="settings-label">
            Select your preferred currency
          </label>
          <select
            id="currency-select"
            value={currency}
            onChange={(e) => onChangeCurrency(e.target.value)}
            className="settings-input"
          >
            <option value="USD">💵 US Dollar ($)</option>
            <option value="INR">💰 Indian Rupee (₹)</option>
            <option value="EUR">💶 Euro (€)</option>
            <option value="JPY">💴 Japanese Yen (¥)</option>
            <option value="NPR">🇳🇵 Nepali Rupee (रू)</option>
          </select>
        </div>
      </div>

      {/* Info Section */}
      <div className="settings-section">
        <h3>About</h3>
        <div className="info-card">
          <p className="about-text">BudgetO v1.0</p>
          <p className="about-text">Manage your finances with ease</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
