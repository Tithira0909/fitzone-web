import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fitzone_cart') || localStorage.getItem('vitacart_cart') || '[]');
    } catch {
      return [];
    }
  });
  const [shippingFee, setShippingFee] = useState(450);

  useEffect(() => {
    api('/admin/store-settings')
      .then((data) => setShippingFee(Number(data.settings.shipping_fee) || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem('fitzone_cart', JSON.stringify(items));
  }, [items]);

  function addItem(product, quantity = 1) {
    setItems((current) => {
      const found = current.find((item) => item.id === product.id);
      if (found) {
        return current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...current, {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: Number(product.price),
        image_url: product.image_url,
        stock: product.stock,
        quantity
      }];
    });
  }

  function updateQuantity(id, quantity) {
    if (quantity < 1) return removeItem(id);
    setItems((current) => current.map((item) => item.id === id ? { ...item, quantity } : item));
  }

  function removeItem(id) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  function clearCart() {
    setItems([]);
  }

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const count = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const shipping = subtotal > 0 && subtotal < 15000 ? shippingFee : 0;
  const total = subtotal + shipping;

  return (
    <CartContext.Provider value={{ items, addItem, updateQuantity, removeItem, clearCart, subtotal, shipping, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
