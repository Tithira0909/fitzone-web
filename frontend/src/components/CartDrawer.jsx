import React, { useState } from 'react';
import { ShoppingBag, X, Minus, Plus, Trash2, ArrowRight, ShieldCheck, Truck, ArrowLeft, LockKeyhole, HandCoins, Check } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency } from '../utils.js';
import { api } from '../api/client.js';

export default function CartDrawer({ navigate }) {
  const { items, updateQuantity, removeItem, subtotal, shipping, total, count, cartOpen, setCartOpen, clearCart } = useCart();
  const { user } = useAuth();
  
  // Sidebar Checkout states
  const [isCheckoutMode, setIsCheckoutMode] = useState(false);
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

  function handleClose() {
    setCartOpen(false);
    setIsCheckoutMode(false); // Reset back to cart view on close
    setError('');
  }

  function handleNavigate(path) {
    handleClose();
    navigate(path);
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleCheckoutSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { 
        ...form, 
        payment_method: 'cash_on_delivery', 
        items: items.map((item) => ({ product_id: item.id, quantity: item.quantity })) 
      };
      const data = await api('/orders/checkout', { method: 'POST', body: JSON.stringify(payload) });
      clearCart();
      handleClose();
      navigate(`/order-success?code=${encodeURIComponent(data.order.order_code)}&total=${data.order.total}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Overlay backdrop */}
      <div 
        className={`drawer-backdrop ${cartOpen ? 'active' : ''}`} 
        onClick={handleClose} 
      />

      {/* Slide-out Panel */}
      <aside className={`cart-drawer-panel ${cartOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <div className="drawer-title">
            {isCheckoutMode ? (
              <button className="drawer-back-btn" onClick={() => setIsCheckoutMode(false)}>
                <ArrowLeft size={18} /> <span>Back to stack</span>
              </button>
            ) : (
              <>
                <ShoppingBag size={20} />
                <span>My Supplement Stack ({count})</span>
              </>
            )}
          </div>
          <button className="drawer-close-btn" onClick={handleClose} aria-label="Close cart">
            <X size={20} />
          </button>
        </div>

        <div className="drawer-body">
          {!items.length ? (
            <div className="drawer-empty-state">
              <div className="empty-bag-icon">
                <ShoppingBag size={36} />
              </div>
              <h3>Your Supplement Stack is Empty</h3>
              <p>
                Select from our premium range of vitamins and performance formulas to power your fitness routine.
              </p>
              <button className="btn lime" onClick={() => handleNavigate('/products')}>
                Explore Supplements <ArrowRight size={16} />
              </button>
            </div>
          ) : isCheckoutMode ? (
            /* ==========================================
               SIDEBAR CHECKOUT FORM (STEP 2)
               ========================================== */
            <form className="drawer-checkout-form" onSubmit={handleCheckoutSubmit}>
              <div className="drawer-checkout-scroll-container">
                <div className="drawer-form-intro">
                  <h3>Complete your order</h3>
                  <p>Enter your contact and delivery information below.</p>
                </div>

                {error && <div className="alert error">{error}</div>}

                <div className="drawer-form-step-title">
                  <span>01</span> Contact information
                </div>
                
                <div className="drawer-form-fields">
                  <label>
                    Full name
                    <input 
                      required 
                      value={form.customer_name} 
                      onChange={(e) => updateForm('customer_name', e.target.value)} 
                      placeholder="Your full name" 
                    />
                  </label>
                  <label>
                    Email address
                    <input 
                      required 
                      type="email" 
                      value={form.customer_email} 
                      onChange={(e) => updateForm('customer_email', e.target.value)} 
                      placeholder="you@example.com" 
                    />
                  </label>
                  <label>
                    Phone number
                    <input 
                      required 
                      value={form.customer_phone} 
                      onChange={(e) => updateForm('customer_phone', e.target.value)} 
                      placeholder="+94 77 123 4567" 
                    />
                  </label>
                  <label>
                    City
                    <input 
                      required 
                      value={form.city} 
                      onChange={(e) => updateForm('city', e.target.value)} 
                      placeholder="Colombo" 
                    />
                  </label>
                  <label>
                    Shipping address
                    <textarea 
                      required 
                      rows="3" 
                      value={form.shipping_address} 
                      onChange={(e) => updateForm('shipping_address', e.target.value)} 
                      placeholder="House number, street, area, postal code" 
                    />
                  </label>
                  <label>
                    Order notes (optional)
                    <textarea 
                      rows="2" 
                      value={form.notes} 
                      onChange={(e) => updateForm('notes', e.target.value)} 
                      placeholder="Delivery instructions or notes" 
                    />
                  </label>
                </div>

                <div className="drawer-form-step-title" style={{ marginTop: '24px' }}>
                  <span>02</span> Payment method
                </div>
                
                <div className="drawer-payment-options">
                  <label className="cod-option active">
                    <input type="radio" name="payment" checked readOnly />
                    <HandCoins size={18} />
                    <span>
                      <strong>Cash on delivery</strong>
                      <small>Pay in cash when order arrives</small>
                    </span>
                    <Check size={16} />
                  </label>
                </div>
              </div>

              {/* Fixed Footer for Checkout Submit */}
              <div className="drawer-checkout-footer">
                <div className="drawer-summary-row">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="drawer-summary-row">
                  <span>Delivery</span>
                  <span>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span>
                </div>
                <div className="drawer-summary-row total">
                  <span>Total amount</span>
                  <strong>{formatCurrency(total)}</strong>
                </div>
                
                <button className="btn primary full" disabled={loading}>
                  <LockKeyhole size={16} />
                  {loading ? 'Placing order...' : `Place order · ${formatCurrency(total)}`}
                </button>
                <p className="secure-note">
                  <ShieldCheck size={14} /> Secure checkout connection
                </p>
              </div>
            </form>
          ) : (
            /* ==========================================
               SIDEBAR CART LIST (STEP 1)
               ========================================== */
            <>
              {/* Delivery Progress Bar */}
              <div className="drawer-shipping-progress">
                <div className="progress-info">
                  <Truck size={16} />
                  <span>
                    {subtotal >= 15000 
                      ? 'You unlocked free delivery!' 
                      : `${formatCurrency(15000 - subtotal)} away from free delivery`}
                  </span>
                </div>
                <div className="progress-track">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${Math.min((subtotal / 15000) * 100, 100)}%` }} 
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="drawer-items-list">
                {items.map((item) => (
                  <div className="drawer-item" key={item.id}>
                    <img 
                      className="drawer-item-img" 
                      src={item.image_url || '/images/multivitamin.svg'} 
                      alt={item.name} 
                      onClick={() => handleNavigate(`/products/${item.slug}`)}
                    />
                    <div className="drawer-item-info">
                      <span className="drawer-item-category">FIT ZONE Nutrition</span>
                      <button 
                        className="drawer-item-title-btn" 
                        onClick={() => handleNavigate(`/products/${item.slug}`)}
                      >
                        {item.name}
                      </button>
                      <span className="drawer-item-price">{formatCurrency(item.price)}</span>
                      
                      <div className="drawer-item-actions">
                        <div className="qty-control compact">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                            <Minus size={12} />
                          </button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, Math.min(item.stock, item.quantity + 1))}>
                            <Plus size={12} />
                          </button>
                        </div>
                        <button className="drawer-item-remove-btn" onClick={() => removeItem(item.id)}>
                          <Trash2 size={15} /> Remove
                        </button>
                      </div>
                    </div>
                    <div className="drawer-item-total-price">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Footer */}
              <div className="drawer-footer">
                <div className="drawer-summary-row">
                  <span>Subtotal</span>
                  <strong>{formatCurrency(subtotal)}</strong>
                </div>
                <div className="drawer-summary-row">
                  <span>Delivery</span>
                  <span>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span>
                </div>
                <div className="drawer-summary-row total">
                  <span>Total</span>
                  <strong>{formatCurrency(total)}</strong>
                </div>

                <div className="drawer-footer-actions">
                  <button className="btn primary full" onClick={() => setIsCheckoutMode(true)}>
                    Secure checkout <ArrowRight size={18} />
                  </button>
                  <button className="btn ghost full" onClick={handleClose}>
                    Continue shopping
                  </button>
                </div>
                <p className="secure-note">
                  <ShieldCheck size={14} /> Secure order processing
                </p>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
