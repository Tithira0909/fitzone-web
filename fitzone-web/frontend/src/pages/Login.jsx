import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login({ navigate }) {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('admin@fitzone.lk');
  const [password, setPassword] = useState('Admin@12345');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/admin' : '/account/orders');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <span className="eyebrow">Welcome back</span>
        <h1>Login</h1>
        {error && <div className="alert error">{error}</div>}
        <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Password<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <button className="btn primary full" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
        <button type="button" className="link-btn" onClick={() => navigate('/register')}>Create customer account</button>
      </form>
    </section>
  );
}
