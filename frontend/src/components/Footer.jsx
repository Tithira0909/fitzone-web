import React from 'react';
import { ArrowRight, Instagram, Mail, MapPin, Phone } from 'lucide-react';

export default function Footer({ navigate }) {
  return (
    <footer className="site-footer">
      <div className="container newsletter">
        <div><span className="eyebrow light">Fuel your inbox</span><h2>Get 10% off your first order.</h2><p>New drops, useful nutrition guides, and member-only offers.</p></div>
        <div className="newsletter-form"><input type="email" placeholder="Enter your email address" /><button aria-label="Subscribe"><ArrowRight /></button></div>
      </div>
      <div className="container footer-grid">
        <div className="footer-about">
          <div className="brand footer-brand"><span className="brand-mark"><i>F</i><i>Z</i></span><span><strong>FIT ZONE</strong><small>NUTRITION</small></span></div>
          <p>Authentic vitamins, minerals, and sports nutrition selected for stronger everyday routines.</p>
          <div className="social-row"><button aria-label="Instagram"><Instagram size={18} /></button><button aria-label="Email"><Mail size={18} /></button></div>
        </div>
        <div>
          <h4>Shop</h4>
          <button onClick={() => navigate('/products')}>All products</button>
          <button onClick={() => navigate('/products?category=daily-essentials')}>Daily essentials</button>
          <button onClick={() => navigate('/products?category=energy-focus')}>Energy & focus</button>
          <button onClick={() => navigate('/cart')}>Your cart</button>
        </div>
        <div>
          <h4>Customer care</h4>
          <button onClick={() => navigate('/login')}>My account</button>
          <button onClick={() => navigate('/account/orders')}>Track an order</button>
          <button>Delivery information</button>
          <button>Returns & refunds</button>
        </div>
        <div className="contact-list">
          <h4>Talk to us</h4>
          <p><Phone size={16} /> +94 77 123 4567</p>
          <p><Mail size={16} /> hello@fitzone.lk</p>
          <p><MapPin size={16} /> Colombo, Sri Lanka</p>
        </div>
      </div>
      <div className="container footer-bottom"><span>© 2026 Fit Zone Nutrition. All rights reserved.</span><span>Supplements are not a substitute for a balanced diet.</span></div>
    </footer>
  );
}
