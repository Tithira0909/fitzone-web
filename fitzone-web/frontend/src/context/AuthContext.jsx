import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fitzone_user') || localStorage.getItem('vitacart_user') || 'null');
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('fitzone_token') || localStorage.getItem('vitacart_token');
    if (!token) return;
    api('/auth/me')
      .then((data) => {
        setUser(data.user);
        localStorage.setItem('fitzone_user', JSON.stringify(data.user));
      })
      .catch(() => logout());
  }, []);

  async function login(email, password) {
    setLoading(true);
    try {
      const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      localStorage.setItem('fitzone_token', data.token);
      localStorage.setItem('fitzone_user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  }

  async function register(payload) {
    setLoading(true);
    try {
      const data = await api('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
      localStorage.setItem('fitzone_token', data.token);
      localStorage.setItem('fitzone_user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('fitzone_token');
    localStorage.removeItem('fitzone_user');
    localStorage.removeItem('vitacart_token');
    localStorage.removeItem('vitacart_user');
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
