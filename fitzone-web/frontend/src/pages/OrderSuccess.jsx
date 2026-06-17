import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../utils.js';

export default function OrderSuccess({ navigate }) {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code') || 'ORDER-CONFIRMED';
  const total = params.get('total');

  return (
    <section className="container narrow success-card">
      <CheckCircle2 size={64} />
      <span className="eyebrow">Order placed</span>
      <h1>Thank you for your order</h1>
      <p>Your order code is <strong>{code}</strong>.</p>
      {total && <p>Total: <strong>{formatCurrency(total)}</strong></p>}
      <div className="hero-actions centered">
        <button className="btn primary" onClick={() => navigate('/products')}>Continue shopping</button>
        <button className="btn ghost" onClick={() => navigate('/account/orders')}>My orders</button>
      </div>
    </section>
  );
}
