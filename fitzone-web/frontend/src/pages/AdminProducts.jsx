import React, { useEffect, useState } from 'react';
import { GripVertical, ImagePlus, Star, Trash2, UploadCloud } from 'lucide-react';
import AdminGuard from '../components/AdminGuard.jsx';
import AdminNav from '../components/AdminNav.jsx';
import { ProductDescriptionEditor } from '../components/ProductDescription.jsx';
import { api } from '../api/client.js';
import { formatCurrency } from '../utils.js';

const emptyProduct = {
  category_id: 1,
  name: '',
  slug: '',
  description: '',
  ingredients: '',
  usage_notes: '',
  price: 0,
  compare_at_price: null,
  stock: 0,
  rating: 0,
  review_count: 0,
  image_url: '/images/multivitamin.svg',
  images: ['/images/multivitamin.svg'],
  is_active: true
};

export default function AdminProducts({ navigate }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  function load() {
    api('/products/admin/all').then((data) => setProducts(data.products)).catch((err) => setError(err.message));
    api('/categories').then((data) => {
      setCategories(data.categories);
      if (data.categories.length) {
        setForm((current) => ({ ...current, category_id: current.category_id || data.categories[0].id }));
      }
    }).catch(console.error);
  }

  useEffect(load, []);

  function slugify(value) {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value, ...(field === 'name' && !editingId ? { slug: slugify(value) } : {}) }));
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyProduct);
    setEditorKey((current) => current + 1);
  }

  function edit(product) {
    const images = product.images?.length ? product.images : [product.image_url || '/images/multivitamin.svg'];
    setEditingId(product.id);
    setForm({
      category_id: Number(product.category_id),
      name: product.name,
      slug: product.slug,
      description: product.description,
      ingredients: product.ingredients || '',
      usage_notes: product.usage_notes || '',
      price: Number(product.price),
      compare_at_price: product.compare_at_price ? Number(product.compare_at_price) : null,
      stock: Number(product.stock),
      rating: Number(product.rating || 0),
      review_count: Number(product.review_count || 0),
      image_url: images[0],
      images,
      is_active: Boolean(product.is_active)
    });
    setEditorKey((current) => current + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function uploadImages(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setError('');
    setUploading(true);
    try {
      const body = new FormData();
      files.forEach((file) => body.append('images', file));
      const data = await api('/products/admin/images', { method: 'POST', body });
      setForm((current) => {
        const existing = current.images?.filter((url) => url !== '/images/multivitamin.svg') || [];
        const images = [...existing, ...data.images].slice(0, 10);
        return { ...current, images, image_url: images[0] || '' };
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  function makePrimary(index) {
    setForm((current) => {
      const images = [...current.images];
      const [primary] = images.splice(index, 1);
      images.unshift(primary);
      return { ...current, images, image_url: primary };
    });
  }

  function removeImage(index) {
    setForm((current) => {
      const images = current.images.filter((_, imageIndex) => imageIndex !== index);
      return { ...current, images, image_url: images[0] || '' };
    });
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      const payload = {
        ...form,
        category_id: Number(form.category_id),
        price: Number(form.price),
        compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
        stock: Number(form.stock),
        rating: Number(form.rating),
        review_count: Number(form.review_count),
        is_active: Boolean(form.is_active)
      };
      if (editingId) await api(`/products/admin/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      else await api('/products/admin', { method: 'POST', body: JSON.stringify(payload) });
      setMessage(editingId ? 'Product updated' : 'Product created');
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function disable(id) {
    if (!window.confirm('Disable this product?')) return;
    await api(`/products/admin/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <AdminGuard navigate={navigate}>
      <section className="container dashboard-page">
        <AdminNav navigate={navigate} />
        <div className="admin-heading"><div><span className="eyebrow">Catalog</span><h1>Products</h1><p>Create products, build image galleries, and publish rich product information.</p></div></div>
        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}
        <form className="admin-form" onSubmit={submit}>
          <h2>{editingId ? 'Edit product' : 'Add product'}</h2>
          <div className="form-grid">
            <label>Category<select value={form.category_id} onChange={(e) => update('category_id', Number(e.target.value))}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            <label>Name<input required value={form.name} onChange={(e) => update('name', e.target.value)} /></label>
            <label>Slug<input required value={form.slug} onChange={(e) => update('slug', e.target.value)} /></label>
            <label>Price<input type="number" min="1" required value={form.price} onChange={(e) => update('price', e.target.value)} /></label>
            <label>Compare price<input type="number" min="0" value={form.compare_at_price || ''} onChange={(e) => update('compare_at_price', e.target.value || null)} /></label>
            <label>Stock<input type="number" min="0" required value={form.stock} onChange={(e) => update('stock', e.target.value)} /></label>
            <label>Star rating<input type="number" min="0" max="5" step="0.1" required value={form.rating} onChange={(e) => update('rating', e.target.value)} /></label>
            <label>Review count<input type="number" min="0" step="1" required value={form.review_count} onChange={(e) => update('review_count', e.target.value)} /></label>
            <label className="checkbox-label"><input type="checkbox" checked={form.is_active} onChange={(e) => update('is_active', e.target.checked)} /> Active</label>
          </div>

          <div className="field-group">
            <div className="field-heading"><span>Description</span><small>Use the slash menu to add headings, tables, images, and logos.</small></div>
            <ProductDescriptionEditor key={editorKey} initialValue={form.description} onChange={(value) => update('description', value)} />
          </div>

          <div className="field-group">
            <div className="field-heading"><span>Product gallery</span><small>Upload up to 10 images. The first image becomes the shop cover.</small></div>
            <label className="image-upload-zone">
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={uploadImages} disabled={uploading} />
              {uploading ? <UploadCloud className="uploading-icon" /> : <ImagePlus />}
              <strong>{uploading ? 'Uploading images...' : 'Choose product images'}</strong>
              <span>JPG, PNG, WebP, or GIF, up to 8 MB each</span>
            </label>
            {!!form.images?.length && (
              <div className="admin-gallery-grid">
                {form.images.map((image, index) => (
                  <div className={index === 0 ? 'admin-gallery-item primary-image' : 'admin-gallery-item'} key={`${image}-${index}`}>
                    <img src={image} alt={`Product gallery ${index + 1}`} />
                    <span className="gallery-order"><GripVertical size={14} /> {index + 1}</span>
                    {index === 0 && <span className="primary-badge"><Star size={12} /> Cover</span>}
                    <div className="gallery-actions">
                      {index > 0 && <button type="button" onClick={() => makePrimary(index)}>Make cover</button>}
                      <button type="button" className="danger-text" onClick={() => removeImage(index)} aria-label="Remove image"><Trash2 size={15} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <label>Ingredients<textarea rows="2" value={form.ingredients} onChange={(e) => update('ingredients', e.target.value)} /></label>
          <label>Usage notes<textarea rows="2" value={form.usage_notes} onChange={(e) => update('usage_notes', e.target.value)} /></label>
          <div className="hero-actions">
            <button className="btn primary" disabled={uploading}>{editingId ? 'Update product' : 'Create product'}</button>
            {editingId && <button type="button" className="btn ghost" onClick={resetForm}>Cancel</button>}
          </div>
        </form>

        <div className="table-card">
          <h2>Product list</h2>
          <table>
            <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Sold</th><th>Stock</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>{products.map((product) => <tr key={product.id}><td>{product.name}</td><td>{product.category_name}</td><td>{formatCurrency(product.price)}</td><td>{product.purchase_count || 0}</td><td>{product.stock}</td><td>{product.is_active ? 'Active' : 'Inactive'}</td><td><button className="link-btn" onClick={() => edit(product)}>Edit</button><button className="link-btn danger-text" onClick={() => disable(product.id)}>Disable</button></td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </AdminGuard>
  );
}
