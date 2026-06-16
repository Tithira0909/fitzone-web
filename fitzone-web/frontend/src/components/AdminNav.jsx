import React from 'react';

export default function AdminNav({ navigate }) {
  return (
    <div className="admin-nav">
      <div className="admin-nav-brand"><span>FZ</span><strong>Store manager</strong></div>
      <button onClick={() => navigate('/admin')}>Dashboard</button>
      <button onClick={() => navigate('/admin/products')}>Products</button>
      <button onClick={() => navigate('/admin/categories')}>Categories</button>
      <button onClick={() => navigate('/admin/hero')}>Hero media</button>
      <button onClick={() => navigate('/admin/orders')}>Orders</button>
      <button className="admin-store-link" onClick={() => navigate('/')}>View store</button>
    </div>
  );
}
