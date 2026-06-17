import React, { useState } from 'react';
import { Check, HandCoins, LockKeyhole } from 'lucide-react';
import { api } from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency } from '../utils.js';

export default function Checkout({ navigate }) {
  const { items, subtotal, shipping, total, clearCart } = useCart();
  const { user } = useAuth();
  const [form, setForm] = useState({
    customer_name: user?.name || '',
    customer_email: user?.email || '',
    customer_phone: user?.phone || '',
    shipping_address: '',
    city: '',
    notes: '',
    payment_method: 'cash_on_delivery'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!items.length) return <section className="container narrow empty"><h1>No products in cart</h1><button className="btn primary" onClick={() => navigate('/products')}>Shop now</button></section>;

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { ...form, payment_method: 'cash_on_delivery', items: items.map((item) => ({ product_id: item.id, quantity: item.quantity })) };
      const data = await api('/orders/checkout', { method: 'POST', body: JSON.stringify(payload) });
      clearCart();
      navigate(`/order-success?code=${encodeURIComponent(data.order.order_code)}&total=${data.order.total}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="container checkout-layout">
      <form className="checkout-form" onSubmit={submit}>
        <div className="page-title left"><span className="eyebrow">Secure checkout</span><h1>Complete your order.</h1><p>Enter your contact and delivery information below.</p></div>
        {error && <div className="alert error">{error}</div>}
        <div className="checkout-step"><span>01</span><div><h3>Contact information</h3><p>We will use this to send order updates.</p></div></div>
        <div className="form-grid">
          <label>Full name<input required value={form.customer_name} onChange={(e) => update('customer_name', e.target.value)} placeholder="Your full name" /></label>
          <label>Email address<input required type="email" value={form.customer_email} onChange={(e) => update('customer_email', e.target.value)} placeholder="you@example.com" /></label>
          <label>Phone number<input required value={form.customer_phone} onChange={(e) => update('customer_phone', e.target.value)} placeholder="+94 77 123 4567" /></label>
          <label>City<input required value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Colombo" /></label>
        </div>
        <label>Shipping address<textarea required rows="4" value={form.shipping_address} onChange={(e) => update('shipping_address', e.target.value)} placeholder="House number, street, area, postal code" /></label>
        <label>Order notes <small>(optional)</small><textarea rows="3" value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Delivery instructions or other notes" /></label>
        <div className="checkout-step"><span>02</span><div><h3>Payment method</h3><p>Pay securely when your delivery arrives.</p></div></div>
        <div className="payment-options">
          <label className="cod-option"><input type="radio" name="payment" checked readOnly /><HandCoins /><span><strong>Cash on delivery</strong><small>Pay in cash when your order arrives</small></span><Check /></label>
        </div>
        <button className="btn primary full checkout-submit" disabled={loading}><LockKeyhole size={18} />{loading ? 'Placing order...' : `Place order · ${formatCurrency(total)}`}</button>
      </form>
      <aside className="summary-card">
        <span className="eyebrow">Your order</span><h2>Order summary</h2>
        {items.map((item) => <div className="checkout-item" key={item.id}><span><img src={item.image_url || '/images/multivitamin.svg'} alt="" /><span><strong>{item.name}</strong><small>Qty {item.quantity}</small></span></span><strong>{formatCurrency(item.price * item.quantity)}</strong></div>)}
        <div><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
        <div><span>Delivery</span><strong>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</strong></div>
        <div className="total"><span>Total</span><strong>{formatCurrency(total)}</strong></div>
      </aside>
    </section>
  );
}
