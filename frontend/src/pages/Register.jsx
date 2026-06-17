import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import useScrollReveal from '../hooks/useScrollReveal.js';

export default function Register({ navigate }) {
  const revealRef = useScrollReveal();
  const { register, loading } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      navigate('/account/orders');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section ref={revealRef} className="auth-page">
      <form className="auth-card reveal-item" onSubmit={submit}>
        <span className="eyebrow">New customer</span>
        <h1>Create account</h1>
        {error && <div className="alert error">{error}</div>}
        <label>Name<input required value={form.name} onChange={(e) => update('name', e.target.value)} /></label>
        <label>Email<input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} /></label>
        <label>Phone<input value={form.phone} onChange={(e) => update('phone', e.target.value)} /></label>
        <label>Password<input type="password" minLength="8" required value={form.password} onChange={(e) => update('password', e.target.value)} /></label>
        <button className="btn primary full" disabled={loading}>{loading ? 'Creating...' : 'Create account'}</button>
        <button type="button" className="link-btn" onClick={() => navigate('/login')}>Already have an account?</button>
      </form>
    </section>
  );
}
