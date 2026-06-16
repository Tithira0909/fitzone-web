import React, { useEffect, useState } from 'react';
import AdminGuard from '../components/AdminGuard.jsx';
import AdminNav from '../components/AdminNav.jsx';
import { api } from '../api/client.js';
import { formatCurrency, statusLabel } from '../utils.js';

export default function AdminDashboard({ navigate }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [shippingFee, setShippingFee] = useState(450);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api('/admin/stats').then(setData).catch((err) => setError(err.message));
    api('/admin/store-settings').then((result) => setShippingFee(result.settings.shipping_fee)).catch((err) => setError(err.message));
  }, []);

  async function saveShipping(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      const result = await api('/admin/store-settings', {
        method: 'PUT',
        body: JSON.stringify({ shipping_fee: Number(shippingFee) })
      });
      setShippingFee(result.settings.shipping_fee);
      setMessage('Shipping fee updated');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AdminGuard navigate={navigate}>
      <section className="container dashboard-page">
        <AdminNav navigate={navigate} />
        <div className="page-title left"><span className="eyebrow">Admin</span><h1>Dashboard</h1></div>
        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}
        {!data ? <p>Loading dashboard...</p> : (
          <>
            <div className="stats-grid">
              <div><span>Total revenue</span><strong>{formatCurrency(data.stats.revenue)}</strong></div>
              <div><span>Orders</span><strong>{data.stats.orders}</strong></div>
              <div><span>Active products</span><strong>{data.stats.products}</strong></div>
              <div><span>Total stock</span><strong>{data.stats.stock}</strong></div>
            </div>
            <form className="shipping-setting-card" onSubmit={saveShipping}>
              <div><span className="eyebrow light">Delivery settings</span><h2>Shipping fee</h2><p>This fee is added below the LKR 15,000 free-delivery threshold.</p></div>
              <label>Fee (LKR)<input type="number" min="0" step="1" value={shippingFee} onChange={(event) => setShippingFee(event.target.value)} /></label>
              <button className="btn primary">Save fee</button>
            </form>
            <div className="dashboard-grid">
              <div className="table-card dashboard-panel orders-panel">
                <div className="panel-heading"><div><span className="eyebrow">Live activity</span><h2>Recent orders</h2></div><button className="btn ghost small" onClick={() => navigate('/admin/orders')}>View all</button></div>
                <div className="table-scroll"><table>
                  <thead><tr><th>Code</th><th>Customer</th><th>Status</th><th>Total</th></tr></thead>
                  <tbody>{data.recentOrders.length ? data.recentOrders.map((order) => <tr key={order.order_code}><td><strong>{order.order_code}</strong></td><td>{order.customer_name}</td><td><span className="status">{statusLabel(order.order_status)}</span></td><td>{formatCurrency(order.total)}</td></tr>) : <tr><td colSpan="4" className="table-empty">No orders yet.</td></tr>}</tbody>
                </table></div>
              </div>
              <div className="table-card dashboard-panel stock-panel">
                <div className="panel-heading"><div><span className="eyebrow">Inventory watch</span><h2>Low stock</h2></div></div>
                <div className="stock-list">
                  {data.lowStock.length ? data.lowStock.map((product) => (
                    <div className="stock-item" key={product.id}>
                      <span><strong>{product.name}</strong><small>Reorder recommended</small></span>
                      <b className={product.stock <= 3 ? 'critical' : ''}>{product.stock}</b>
                    </div>
                  )) : <div className="healthy-stock">All active products have healthy stock levels.</div>}
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </AdminGuard>
  );
}
