import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency, statusLabel } from '../utils.js';
import useScrollReveal from '../hooks/useScrollReveal.js';

export default function AccountOrders({ navigate }) {
  const revealRef = useScrollReveal();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    api('/orders/my').then((data) => setOrders(data.orders)).catch((err) => setError(err.message));
  }, [user]);

  if (!user) return <section className="container narrow empty"><h1>Login required</h1><button className="btn primary" onClick={() => navigate('/login')}>Login</button></section>;

  return (
    <section ref={revealRef} className="container dashboard-page">
      <div className="page-title left reveal-item"><span className="eyebrow">Account</span><h1>My orders</h1></div>
      {error && <div className="alert error">{error}</div>}
      <div className="table-card reveal-item reveal-delay-1">
        <table>
          <thead><tr><th>Order</th><th>Status</th><th>Payment</th><th>Total</th><th>Date</th></tr></thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.order_code}</td>
                <td><span className="status">{statusLabel(order.order_status)}</span></td>
                <td>{statusLabel(order.payment_status)}</td>
                <td>{formatCurrency(order.total)}</td>
                <td>{new Date(order.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!orders.length && <p className="muted table-empty">No orders yet.</p>}
      </div>
    </section>
  );
}
