import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminGuard({ children, navigate }) {
  const { user } = useAuth();
  if (!user) {
    return <section className="container narrow empty"><h2>Login required</h2><p>Please login as admin to continue.</p><button className="btn primary" onClick={() => navigate('/login')}>Login</button></section>;
  }
  if (user.role !== 'admin') {
    return <section className="container narrow empty"><h2>Admin access required</h2><p>Your account does not have permission to access this section.</p></section>;
  }
  return children;
}
