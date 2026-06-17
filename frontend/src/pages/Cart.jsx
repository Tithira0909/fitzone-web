import React from 'react';
import { ArrowRight, Minus, Plus, ShieldCheck, Trash2, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { formatCurrency } from '../utils.js';
import useScrollReveal from '../hooks/useScrollReveal.js';

export default function Cart({ navigate }) {
  const revealRef = useScrollReveal();
  const { items, updateQuantity, removeItem, subtotal, shipping, total } = useCart();

  if (!items.length) {
    return <section className="container narrow empty"><span className="eyebrow">Your bag</span><h1>Your cart is empty.</h1><p>Start with daily essentials or browse the full Fit Zone collection.</p><button className="btn primary" onClick={() => navigate('/products')}>Shop products</button></section>;
  }

  return (
    <section ref={revealRef} className="container cart-layout">
      <div>
        <div className="page-title left reveal-item"><span className="eyebrow">Your bag</span><h1>Shopping cart <sup>{items.length}</sup></h1><p>Review your products before checkout.</p></div>
        <div className="shipping-progress reveal-item reveal-delay-1"><div><Truck size={18} /><span>{subtotal >= 15000 ? 'You unlocked free delivery.' : `${formatCurrency(15000 - subtotal)} away from free delivery`}</span></div><progress value={Math.min(subtotal, 15000)} max="15000" /></div>
        <div className="cart-list reveal-item reveal-delay-2">
          {items.map((item) => (
            <div className="cart-item" key={item.id}>
              <img src={item.image_url || '/images/multivitamin.svg'} alt={item.name} />
              <div>
                <span className="product-category">Fit Zone selection</span>
                <button className="product-title" onClick={() => navigate(`/products/${item.slug}`)}>{item.name}</button>
                <p>{formatCurrency(item.price)}</p>
              </div>
              <div className="qty-control compact">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus size={14} /></button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, Math.min(item.stock, item.quantity + 1))}><Plus size={14} /></button>
              </div>
              <strong>{formatCurrency(item.price * item.quantity)}</strong>
              <button className="icon-btn danger" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`}><Trash2 size={18} /></button>
            </div>
          ))}
        </div>
      </div>
      <aside className="summary-card reveal-item reveal-delay-3">
        <span className="eyebrow">Order summary</span><h2>Your total</h2>
        <div><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
        <div><span>Delivery</span><strong>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</strong></div>
        <div className="total"><span>Total</span><strong>{formatCurrency(total)}</strong></div>
        <button className="btn primary full" onClick={() => navigate('/checkout')}>Secure checkout <ArrowRight size={18} /></button>
        <button className="btn ghost full" onClick={() => navigate('/products')}>Continue shopping</button>
        <p className="secure-note"><ShieldCheck size={16} /> Secure order processing</p>
      </aside>
    </section>
  );
}
