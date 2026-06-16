import React, { useEffect, useState } from 'react';
import AdminGuard from '../components/AdminGuard.jsx';
import AdminNav from '../components/AdminNav.jsx';
import { api } from '../api/client.js';
import { formatCurrency, statusLabel } from '../utils.js';

export default function AdminOrders({ navigate }) {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  function load() {
    api('/orders/admin').then((data) => setOrders(data.orders)).catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function changeStatus(id, order_status) {
    try {
      await api(`/orders/admin/${id}/status`, { method: 'PATCH', body: JSON.stringify({ order_status }) });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AdminGuard navigate={navigate}>
      <section className="container dashboard-page">
        <AdminNav navigate={navigate} />
        <div className="page-title left"><span className="eyebrow">Admin</span><h1>Orders</h1></div>
        {error && <div className="alert error">{error}</div>}
        <div className="table-card wide">
          <table>
            <thead><tr><th>Order</th><th>Customer</th><th>Phone</th><th>City</th><th>Status</th><th>Payment</th><th>Total</th><th>Action</th></tr></thead>
            <tbody>{orders.map((order) => (
              <tr key={order.id}>
                <td>{order.order_code}</td>
                <td>{order.customer_name}<br /><small>{order.customer_email}</small></td>
                <td>{order.customer_phone}</td>
                <td>{order.city}</td>
                <td><span className="status">{statusLabel(order.order_status)}</span></td>
                <td>{statusLabel(order.payment_method)} / {statusLabel(order.payment_status)}</td>
                <td>{formatCurrency(order.total)}</td>
                <td><select value={order.order_status} onChange={(e) => changeStatus(order.id, e.target.value)}><option value="pending_payment">Pending payment</option><option value="processing">Processing</option><option value="packed">Packed</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
    </AdminGuard>
  );
}
