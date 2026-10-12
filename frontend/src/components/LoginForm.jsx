import React, { useState } from 'react';

export default function LoginForm({ onLogin, onFocus, onBlur }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    userName: '', email: '', password: '', confirmPassword: '', passkey: '', kingdomStatus: 'Kingdom Beginner'
  });
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recoveryStep, setRecoveryStep] = useState('NONE'); // NONE, EMAIL, OTP, NEW_PASSWORD

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOtpChange = (e) => {
    setOtp(e.target.value);
  };

  const handleGoogleSuccess = async (response) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:8000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: response.credential }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Google Login failed');

      onLogin(
        data.kingdomStatus || 'Kingdom Beginner',
        data.userName || 'Hero',
        data.role || 'User'
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    /* global google */
    if (window.google) {
      google.accounts.id.initialize({
        client_id: "your-google-client-id.apps.googleusercontent.com", // Replace with actual or use env
        callback: handleGoogleSuccess,
      });
      google.accounts.id.renderButton(
        document.getElementById("googleSignInDiv"),
        { theme: "outline", size: "large", width: "100%" }
      );
    }
  }, [isLogin, otpSent]);

  /**
   * Main Submission Handler
   * Orchestrates the two-step verification flow for both Login and Signup.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // --- Validation Phase ---
    if (!isLogin && !otpSent && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please verify your entries.');
      setLoading(false);
      return;
    }

    try {
      // --- Step 1: Initial Request (Login or Signup) ---
      if (!otpSent) {
        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/request-signup-otp';
        const body = isLogin
          ? { email: formData.email, password: formData.password }
          : { email: formData.email };

        const response = await fetch(`http://localhost:8000${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Request failed. Please check your connection.');

        setOtpSent(true);
        setError(data.message); // Displays success message from server
      }

      // --- Step 2: Final Verification ---
      else {
        const endpoint = isLogin ? '/api/auth/verify-otp' : '/api/auth/signup';
        const body = isLogin
          ? { email: formData.email, otp: otp }
          : {
            userName: formData.userName,
            email: formData.email,
            password: formData.password,
            passkey: formData.passkey || undefined,
            kingdomStatus: formData.kingdomStatus,
            otp: otp
          };

        const response = await fetch(`http://localhost:8000${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Verification failed. Incorrect or expired code.');

        // Success: Trigger app login
        onLogin(
          data.kingdomStatus || 'Kingdom Beginner',
          data.userName || formData.userName,
          data.role || 'User'
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Password Recovery Handlers
   */
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:8000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to initiate recovery.');
      setRecoveryStep('OTP');
      setError(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:8000/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: otp }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Invalid recovery code.');
      setRecoveryStep('NEW_PASSWORD');
      setError(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:8000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otp: otp,
          newPassword: formData.password
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Reset failed.');

      setRecoveryStep('NONE');
      setIsLogin(true);
      setError('Password reset successfully! Please log in.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resend OTP Handler
   */
  const handleResend = async () => {
    setLoading(true);
    setError('');
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/request-signup-otp';
      const body = isLogin
        ? { email: formData.email, password: formData.password }
        : { email: formData.email };

      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Resend failed. Please check your connection.');
      setError(`New code sent! ${data.message}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resets form state when switching between Login and Register
   */
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setOtpSent(false);
    setOtp('');
    setRecoveryStep('NONE');
    setFormData({
      userName: '',
      email: '',
      password: '',
      confirmPassword: '',
      passkey: '',
      kingdomStatus: 'Kingdom Beginner'
    });
  };

  return (
    <div className="login-overlay">
      <div className="login-panel">
        {/* Kingdom Branding */}
        <div className="login-header">
          <h1 className="login-title">
            <span className="crown-icon">👑</span>
            Castle Kingdom
          </h1>
          <p className="login-subtitle">
            {isLogin ? (otpSent ? 'Confirm Your Identity' : 'Secure Access to the Realm') : 'Forge Your Legend'}
          </p>
        </div>

        {/* Global Error / Status Display */}
        {error && (
          <div className={`login-error ${error.includes('sent') || error.includes('code') ? 'status-msg' : ''}`}>
            {error}
          </div>
        )}
        {/* Dynamic Form Assembly */}
        <form
          onSubmit={
            recoveryStep === 'EMAIL' ? handleForgotPassword :
              recoveryStep === 'OTP' ? handleVerifyResetOtp :
                recoveryStep === 'NEW_PASSWORD' ? handleResetPassword :
                  handleSubmit
          }
          className="login-form"
        >
          {recoveryStep === 'EMAIL' ? (
            /* --- Recovery Step 1: Email --- */
            <div className="fade-in">
              <div className="input-group">
                <span className="input-icon">📧</span>
                <input
                  name="email"
                  type="email"
                  placeholder="Enter Registered Email"
                  value={formData.email}
                  onChange={handleChange}
                  className="login-input"
                  required
                />
              </div>
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? 'Processing...' : 'Verify Email ⚔️'}
              </button>
              <button type="button" onClick={() => setRecoveryStep('NONE')} className="back-btn">
                ← Back to Login
              </button>
            </div>
          ) : recoveryStep === 'OTP' ? (
            /* --- Recovery Step 2: OTP --- */
            <div className="fade-in">
              <p style={{ textAlign: 'center', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Enter the recovery code sent to <strong>{formData.email}</strong>
              </p>
              <div className="input-group">
                <span className="input-icon">🔢</span>
                <input
                  name="otp"
                  placeholder="6-digit Code"
                  value={otp}
                  onChange={handleOtpChange}
                  className="login-input"
                  required
                  maxLength="6"
                  style={{ textAlign: 'center', letterSpacing: '4px' }}
                />
              </div>
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify Code 🛡️'}
              </button>
              <div className="resend-container">
                <button type="button" onClick={handleForgotPassword} className="resend-otp-btn" disabled={loading}>
                  📩 Resend Recovery Code
                </button>
              </div>
              <button type="button" onClick={() => setRecoveryStep('EMAIL')} className="back-btn">
                ← Back
              </button>
            </div>
          ) : recoveryStep === 'NEW_PASSWORD' ? (
            /* --- Recovery Step 3: New Password --- */
            <div className="fade-in">
              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <span className="input-icon">🔒</span>
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New Royal Secret"
                  value={formData.password}
                  onChange={handleChange}
                  className="login-input"
                  required
                />
                <span className="eye-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? '🙈' : '👁️'}
                </span>
              </div>
              <div className="input-group">
                <span className="input-icon">🔐</span>
                <input
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirm Secret"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="login-input"
                  required
                />
                <span className="eye-toggle" onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? '🙈' : '👁️'}
                </span>
              </div>
              <button type="submit" className="login-btn" style={{ marginTop: '1.5rem' }} disabled={loading}>
                {loading ? 'Updating...' : 'Reset Password 👑'}
              </button>
            </div>
          ) : (
            /* --- Standard Login/Signup Flow --- */
            <>
              {!otpSent ? (
                /* --- Phase 1: Information Gathering --- */
                <>
                  {!isLogin && (
                    <div className="input-group fade-in">
                      <span className="input-icon">🏰</span>
                      <input
                        name="userName"
                        placeholder="Warlord Name"
                        value={formData.userName}
                        onChange={handleChange}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        className="login-input"
                        required
                        autoComplete="off"
                      />
                    </div>
                  )}

                  <div className="input-group fade-in">
                    <span className="input-icon">📧</span>
                    <input
                      name="email"
                      type="email"
                      placeholder="Realm Email"
                      value={formData.email}
                      onChange={handleChange}
                      onFocus={onFocus}
                      onBlur={onBlur}
                      className="login-input"
                      required
                      autoComplete="off"
                    />
                  </div>

                  <div className="input-group fade-in">
                    <span className="input-icon">🔒</span>
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Strong Secret"
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={onFocus}
                      onBlur={onBlur}
                      className="login-input"
                      required
                    />
                    <span className="eye-toggle" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? '🙈' : '👁️'}
                    </span>
                  </div>

                  {isLogin && (
                    <div className="forgot-password-container fade-in">
                      <button type="button" className="forgot-password-link" onClick={() => setRecoveryStep('EMAIL')}>
                        Forgot Password?
                      </button>
                    </div>
                  )}

                  {!isLogin && (
                    <>
                      <div className="input-group fade-in">
                        <span className="input-icon">🔐</span>
                        <input
                          name="confirmPassword"
                          type={showConfirm ? 'text' : 'password'}
                          placeholder="Confirm Secret"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          onFocus={onFocus}
                          onBlur={onBlur}
                          className="login-input"
                          required
                        />
                        <span className="eye-toggle" onClick={() => setShowConfirm(!showConfirm)}>
                          {showConfirm ? '🙈' : '👁️'}
                        </span>
                      </div>

                      <div className="input-group fade-in">
                        <span className="input-icon">🔑</span>
                        <input
                          name="passkey"
                          placeholder="Admin Scroll (Optional)"
                          value={formData.passkey}
                          onChange={handleChange}
                          onFocus={onFocus}
                          onBlur={onBlur}
                          className="login-input"
                        />
                      </div>

                      <div className="kingdom-select fade-in">
                        <label className="kingdom-label">⚔️ Destined Path:</label>
                        <select
                          name="kingdomStatus"
                          value={formData.kingdomStatus}
                          onChange={handleChange}
                          className="login-input kingdom-dropdown"
                        >
                          <option value="Kingdom Beginner">👑 Kingdom Beginner — Build a Coding Village</option>
                          <option value="Kingdom Warrior">🏰 Kingdom Warrior — Expand via Assessment</option>
                        </select>
                      </div>
                    </>
                  )}
                </>
              ) : (
                /* --- Phase 2: OTP Verification --- */
                <div className="otp-container fade-in">
                  <p style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '1.2rem', textAlign: 'center' }}>
                    We've sent a 6-digit verification scroll to <strong>{formData.email}</strong>.
                  </p>
                  <div className="input-group">
                    <span className="input-icon">🔢</span>
                    <input
                      name="otp"
                      placeholder="Enter 6-digit Code"
                      value={otp}
                      onChange={handleOtpChange}
                      onFocus={onFocus}
                      onBlur={onBlur}
                      className="login-input"
                      required
                      maxLength="6"
                      autoComplete="off"
                      style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem' }}
                    />
                  </div>
                  <div className="resend-container">
                    <button
                      type="button"
                      onClick={handleResend}
                      className="resend-otp-btn"
                      disabled={loading}
                    >
                      📩 Resend Code
                    </button>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? (
                  <span className="btn-loading">
                    <span className="spinner"></span> {otpSent ? 'Authenticating...' : 'Processing...'}
                  </span>
                ) : (
                  otpSent ? '🛡️ Verify & Enter' : (isLogin ? '⚔️ Enter the Realm' : '🏰 Register for Glory')
                )}
              </button>

              {/* Third-Party Login */}
              {isLogin && !otpSent && (
                <div className="google-login-container fade-in" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                  <div id="googleSignInDiv"></div>
                </div>
              )}

              {/* Navigation */}
              {otpSent && (
                <button type="button" onClick={() => setOtpSent(false)} className="back-btn fade-in">
                  ← Correction / Resend
                </button>
              )}
            </>
          )}
        </form>

        {/* Mode Toggler */}
        {!otpSent && recoveryStep === 'NONE' && (
          <div className="login-toggle">
            <span>{isLogin ? 'New to the realm? ' : 'Returning ruler? '}</span>
            <button onClick={toggleMode} className="toggle-btn">
              {isLogin ? 'Claim Your Throne' : 'Login to Your Castle'}
            </button>
          </div>
        )}

        {/* Contextual Info */}
        {!isLogin && !otpSent && (
          <div className="path-info fade-in">
            <strong>Choose Your Path:</strong>
            <ul>
              <li>👑 <strong>Beginner</strong> — Immediate module access</li>
              <li>🏰 <strong>Warrior</strong> — Persona-driven AI evaluation</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
