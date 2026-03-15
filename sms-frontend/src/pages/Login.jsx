// src/pages/Login.jsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import { loginAdmin } from '../services/api';
import crest from '../assets/crest.png';

/* ─── inline styles scoped to Login ────────────────────────────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@700;900&family=Source+Sans+3:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html, body, #root {
    width: 100%;
    min-height: 100vh;
    margin: 0;
    padding: 0;
  }

  .login-page {
    width: 100%;
    min-height: 100vh;
    background: #f0f0f0;
    display: flex;
    flex-direction: column;
    font-family: 'Source Sans 3', sans-serif;
  }

  /* ── Top bar ── */
  .login-topbar {
    background: #fff;
    padding: 14px 28px;
    border-bottom: 1px solid #e2e2e2;
    font-family: 'Merriweather', serif;
    font-size: 13px;
    font-weight: 700;
    color: #111;
    letter-spacing: 0.02em;
  }

  /* ── Center stage ── */
  .login-stage {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 16px;
  }

  /* ── Card ── */
  .login-card {
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.10);
    padding: 40px 44px 36px;
    width: 100%;
    max-width: 420px;
    display: flex;
    flex-direction: column;
    align-items: center;
    animation: cardIn 0.45s cubic-bezier(.22,.68,0,1.2) both;
  }

  @keyframes cardIn {
    from { opacity: 0; transform: translateY(22px) scale(0.97); }
    to   { opacity: 1; transform: none; }
  }

  /* ── Crest ── */
  .login-crest {
    width: 110px;
    height: 110px;
    object-fit: contain;
    margin-bottom: 14px;
    filter: drop-shadow(0 2px 6px rgba(0,0,0,0.18));
  }

  /* ── System title ── */
  .login-system-title {
    font-family: 'Merriweather', serif;
    font-size: 17px;
    font-weight: 900;
    color: #111;
    letter-spacing: 0.01em;
    margin-bottom: 24px;
    text-align: center;
  }

  /* ── Form header ── */
  .login-form-header {
    width: 100%;
    margin-bottom: 20px;
  }
  .login-form-title {
    font-family: 'Merriweather', serif;
    font-size: 20px;
    font-weight: 700;
    color: #111;
    margin-bottom: 5px;
  }
  .login-form-subtitle {
    font-size: 13.5px;
    color: #666;
  }

  /* ── Form body ── */
  .login-form {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* ── Global error ── */
  .login-global-error {
    background: #fff0f0;
    border: 1px solid #f5c2c2;
    color: #c0392b;
    border-radius: 6px;
    padding: 10px 14px;
    font-size: 13.5px;
    text-align: center;
    animation: shake 0.35s ease;
  }
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    20%,60%  { transform: translateX(-6px); }
    40%,80%  { transform: translateX(6px); }
  }

  /* ── Input group ── */
  .input-group { display: flex; flex-direction: column; gap: 6px; width: 100%; }
  .input-label {
    font-size: 13px;
    font-weight: 600;
    color: #222;
    letter-spacing: 0.01em;
  }
  .input-wrapper { position: relative; display: flex; align-items: center; }
  .input-icon {
    position: absolute;
    left: 12px;
    color: #9aa3af;
    display: flex;
    align-items: center;
    pointer-events: none;
    font-size: 15px;
  }
  .input-right {
    position: absolute;
    right: 12px;
    color: #9aa3af;
    display: flex;
    align-items: center;
    cursor: pointer;
    font-size: 15px;
    transition: color 0.2s;
  }
  .input-right:hover { color: #555; }
  .input-field {
    width: 100%;
    height: 44px;
    border: 1.5px solid #dde0e4;
    border-radius: 7px;
    padding: 0 14px;
    font-family: inherit;
    font-size: 14px;
    color: #111;
    background: #fafafa;
    transition: border-color 0.2s, box-shadow 0.2s;
    outline: none;
  }
  .input-field.has-icon  { padding-left: 36px; }
  .input-field.has-right { padding-right: 38px; }
  .input-field:focus {
    border-color: #E8403A;
    box-shadow: 0 0 0 3px rgba(232,64,58,0.12);
    background: #fff;
  }
  .input-field.input-error { border-color: #e74c3c; }
  .input-error-msg { font-size: 12px; color: #e74c3c; }
  .input-field::placeholder { color: #aab0b8; }

  /* ── Password row (label + forgot) ── */
  .password-label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .forgot-link {
    font-size: 12.5px;
    color: #E8403A;
    text-decoration: none;
    font-weight: 600;
    transition: opacity 0.2s;
  }
  .forgot-link:hover { opacity: 0.75; }

  /* ── Remember me ── */
  .remember-row {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
  }
  .remember-row input[type="checkbox"] {
    width: 15px;
    height: 15px;
    accent-color: #E8403A;
    cursor: pointer;
  }
  .remember-label { font-size: 13.5px; color: #444; }

  /* ── Button ── */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: none;
    border-radius: 7px;
    font-family: inherit;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s, transform 0.12s, box-shadow 0.2s;
    height: 48px;
    padding: 0 24px;
    letter-spacing: 0.02em;
  }
  .btn-primary {
    background: #E8403A;
    color: #fff;
    box-shadow: 0 4px 14px rgba(232,64,58,0.35);
  }
  .btn-primary:hover:not(:disabled) {
    background: #d43530;
    box-shadow: 0 6px 18px rgba(232,64,58,0.45);
    transform: translateY(-1px);
  }
  .btn-primary:active:not(:disabled) { transform: translateY(0); }
  .btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }
  .btn-full { width: 100%; }
  .btn-spinner {
    width: 18px; height: 18px;
    border: 2.5px solid rgba(255,255,255,0.4);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Footer info ── */
  .login-footer {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .login-secure {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12.5px;
    color: #999;
  }
  .login-support {
    font-size: 13px;
    color: #666;
  }
  .login-support a {
    color: #E8403A;
    font-weight: 600;
    text-decoration: none;
    transition: opacity 0.2s;
  }
  .login-support a:hover { opacity: 0.75; }
`;

/* ─── SVG icons ──────────────────────────────────────────────────────────────── */
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const IconEye = ({ crossed }) => crossed ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const IconShield = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const IconArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

/* ─── Component ──────────────────────────────────────────────────────────────── */
const Login = () => {
  const navigate = useNavigate();
  const passwordRef = useRef(null);

  const [username, setUsername]         = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe]     = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) { setError('Please enter your username'); return; }
    if (!password)        { setError('Please enter your password.'); return; }

    setLoading(true);
    try {
      const data = await loginAdmin({ username: username.trim(), password });

      localStorage.setItem('token', data.token);
      localStorage.setItem('admin', JSON.stringify(data.admin));
      if (rememberMe) {
        localStorage.setItem('rememberedUser', username.trim());
      } else {
        localStorage.removeItem('rememberedUser');
      }

      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>

      <div className="login-page">
        <header className="login-topbar">Student Management System</header>

        <main className="login-stage">
          <div className="login-card">

            <img src={crest} alt="Institution Crest" className="login-crest" />

            <h1 className="login-system-title">Student Management System</h1>

            <div className="login-form-header">
              <h2 className="login-form-title">Admin Portal Login</h2>
              <p className="login-form-subtitle">Please enter your credentials to access the dashboard.</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit} noValidate>

              {error && (
                <div className="login-global-error" role="alert">{error}</div>
              )}

              {/* Username */}
              <div className="input-group">
                <label htmlFor="username" className="input-label">Username</label>
                <div className="input-wrapper">
                  <span className="input-icon"><IconUser /></span>
                  <input
                    id="username"
                    type="text"
                    placeholder="e.g. admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); passwordRef.current?.focus(); } }}
                    className="input-field has-icon"
                    autoComplete="username"
                    autoFocus
                  />
                </div>
              </div>

              {/* Password */}
              <div className="input-group">
                <div className="password-label-row">
                  <label htmlFor="password" className="input-label">Password</label>
                  <a href="/forgot-password" className="forgot-link">Forgot password?</a>
                </div>
                <div className="input-wrapper">
                  <span className="input-icon"><IconLock /></span>
                  <input
                    id="password"
                    ref={passwordRef}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(e); }}
                    className="input-field has-icon has-right"
                    autoComplete="current-password"
                  />
                  <span
                    className="input-right"
                    onClick={() => setShowPassword((v) => !v)}
                    role="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setShowPassword((v) => !v)}
                  >
                    <IconEye crossed={showPassword} />
                  </span>
                </div>
              </div>

              {/* Remember me */}
              <label className="remember-row">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="remember-label">Remember this device</span>
              </label>

              {/* Submit */}
              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                disabled={loading}
              >
                Sign In &nbsp;<IconArrow />
              </Button>
            </form>

          </div>
        </main>
      </div>
    </>
  );
};

export default Login;