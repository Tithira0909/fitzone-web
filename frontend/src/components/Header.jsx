import React, { useState, useEffect } from 'react';
import { ChevronDown, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Header({ navigate, route }) {
  const { count, setCartOpen } = useCart();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function go(path) {
    setOpen(false);
    navigate(path);
  }

  const link = (path, label) => (
    <button className={route === path ? 'nav-link active' : 'nav-link'} onClick={() => go(path)}>{label}</button>
  );

  return (
    <>
      <div className="announcement">
        <div className="container announcement-inner">
          <span>Free islandwide delivery on orders over LKR 15,000</span>
          <span className="announcement-secondary">Authentic products · Secure checkout · Expert support</span>
        </div>
      </div>
      <header className={scrolled ? 'site-header scrolled' : 'site-header'}>
        <div className="container header-inner">
          <button className="brand" onClick={() => go('/')}>
            <span className="brand-mark"><i>F</i><i>Z</i></span>
            <span><strong>FIT ZONE</strong><small>NUTRITION</small></span>
          </button>

          <nav className={open ? 'nav open' : 'nav'}>
            {link('/', 'Home')}
            <button className={route === '/products' ? 'nav-link active' : 'nav-link'} onClick={() => go('/products')}>Shop <ChevronDown size={14} /></button>
            <button className="nav-link" onClick={() => go('/products?category=daily-essentials')}>Vitamins</button>
            <button className="nav-link" onClick={() => go('/products?category=energy-focus')}>Performance</button>
            {user && link('/account/orders', 'My orders')}
            {user?.role === 'admin' && link('/admin', 'Admin')}
          </nav>

          <div className="header-actions">
            <button className="icon-btn desktop-icon" onClick={() => go('/products')} aria-label="Search"><Search size={19} /></button>
            {user ? (
              <button className="account-button" onClick={() => go(user.role === 'admin' ? '/admin' : '/account/orders')}>
                <User size={18} /><span>{user.name.split(' ')[0]}</span>
              </button>
            ) : (
              <button className="icon-btn" onClick={() => go('/login')} aria-label="Login"><User size={19} /></button>
            )}
            <button className="icon-btn cart-btn" onClick={() => setCartOpen(true)} aria-label="Cart">
              <ShoppingBag size={20} />
              {count > 0 && <span className="cart-count">{count}</span>}
            </button>
            {user && <button className="logout-link" onClick={() => { logout(); go('/'); }}>Sign out</button>}
            <button className="mobile-toggle" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X /> : <Menu />}</button>
          </div>
        </div>
      </header>
    </>
  );
}
