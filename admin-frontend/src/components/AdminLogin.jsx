import React, { useState } from 'react';

export default function AdminLogin({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError('Please provide your staff username/email and password.');
      return;
    }

    setIsLoading(true);

    try {
      // Direct relative API call to /wordpress/shree-shahi-admin/api/auth.php
      const response = await fetch('/wordpress/shree-shahi-admin/api/auth.php?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        onLoginSuccess(data.token, data.user);
      } else {
        setError(data.message || 'Authentication failed. Please verify credentials.');
      }
    } catch (err) {
      setError('Unable to connect to the Admin Authentication API. Please verify server status.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-screen-wrapper">
      <div className="login-card">
        <div className="login-header">
          <div className="login-emblem">👑</div>
          <h1 className="login-title">SAHU JI GAJAK</h1>
          <p className="login-subtitle">Royal Operations & E-Commerce Darbar</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate autoComplete="off">
          {error && (
            <div className="login-alert" role="alert">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="admin-username">
              Administrator Username or Email
            </label>
            <input
              id="admin-username"
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter administrator username"
              autoComplete="off"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="admin-password">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="new-password"
              required
            />
          </div>

          <button type="submit" className="btn-login" disabled={isLoading}>
            {isLoading ? (
              <>
                <span>⏳</span>
                <span>Authenticating Staff...</span>
              </>
            ) : (
              <>
                <span>🔐</span>
                <span>Enter Royal Operations</span>
              </>
            )}
          </button>

          <p className="login-footer-hint">
            Authorized Personnel Only • Single Source of Truth: WooCommerce
          </p>
        </form>
      </div>
    </div>
  );
}

