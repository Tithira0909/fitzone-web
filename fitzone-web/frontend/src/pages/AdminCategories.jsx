import React, { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import AdminGuard from '../components/AdminGuard.jsx';
import AdminNav from '../components/AdminNav.jsx';
import { api } from '../api/client.js';

const emptyCategory = { name: '', slug: '', description: '' };

export default function AdminCategories({ navigate }) {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyCategory);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function load() {
    api('/categories')
      .then((data) => setCategories(data.categories))
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  function slugify(value) {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  function update(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'name' && !editingId ? { slug: slugify(value) } : {})
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      const path = editingId ? `/categories/admin/${editingId}` : '/categories/admin';
      await api(path, { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(form) });
      setMessage(editingId ? 'Category updated' : 'Category created');
      setEditingId(null);
      setForm(emptyCategory);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function edit(category) {
    setEditingId(category.id);
    setForm({ name: category.name, slug: category.slug, description: category.description || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function remove(category) {
    if (!window.confirm(`Delete "${category.name}"?`)) return;
    setError('');
    try {
      await api(`/categories/admin/${category.id}`, { method: 'DELETE' });
      setMessage('Category deleted');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AdminGuard navigate={navigate}>
      <section className="container dashboard-page">
        <AdminNav navigate={navigate} />
        <div className="admin-heading">
          <div><span className="eyebrow">Catalog</span><h1>Categories</h1><p>Organize products into clear storefront collections.</p></div>
          <div className="admin-heading-icon"><Plus /></div>
        </div>
        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}

        <form className="admin-form compact-form" onSubmit={submit}>
          <div className="form-section-title">
            <div><span className="step-number">01</span><div><h2>{editingId ? 'Edit category' : 'Create category'}</h2><p>Use a short customer-friendly name and URL slug.</p></div></div>
          </div>
          <div className="form-grid">
            <label>Category name<input required value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Sports Nutrition" /></label>
            <label>URL slug<input required value={form.slug} onChange={(e) => update('slug', e.target.value)} placeholder="sports-nutrition" /></label>
          </div>
          <label>Description<textarea rows="3" value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="A short description shown to your team and customers." /></label>
          <div className="hero-actions">
            <button className="btn primary"><Plus size={18} />{editingId ? 'Save changes' : 'Add category'}</button>
            {editingId && <button type="button" className="btn ghost" onClick={() => { setEditingId(null); setForm(emptyCategory); }}>Cancel</button>}
          </div>
        </form>

        <div className="category-admin-grid">
          {categories.map((category) => (
            <article className="category-admin-card" key={category.id}>
              <div>
                <span className="category-count">{category.product_count || 0} products</span>
                <h3>{category.name}</h3>
                <p>{category.description || 'No description added yet.'}</p>
                <code>/{category.slug}</code>
              </div>
              <div className="row-actions">
                <button className="icon-btn" onClick={() => edit(category)} aria-label={`Edit ${category.name}`}><Pencil size={17} /></button>
                <button className="icon-btn danger" onClick={() => remove(category)} aria-label={`Delete ${category.name}`}><Trash2 size={17} /></button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AdminGuard>
  );
}
