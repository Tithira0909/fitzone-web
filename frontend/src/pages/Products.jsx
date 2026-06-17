import React, { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { api } from '../api/client.js';
import ProductCard from '../components/ProductCard.jsx';
import useScrollReveal from '../hooks/useScrollReveal.js';

export default function Products({ navigate }) {
  const revealRef = useScrollReveal();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(() => new URLSearchParams(window.location.search).get('category') || '');
  const [sort, setSort] = useState('featured');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/categories').then((data) => setCategories(data.categories)).catch(console.error);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({ search, category, sort });
    setLoading(true);
    api(`/products?${params.toString()}`)
      .then((data) => setProducts(data.products))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, category, sort]);

  const resultText = useMemo(() => loading ? 'Loading products...' : `${products.length} products`, [loading, products]);

  return (
    <section ref={revealRef} className="container shop-page">
      <div className="page-title reveal-item">
        <span className="eyebrow">Fit Zone shop</span>
        <h1>Nutrition for every goal.</h1>
        <p>Shop authentic vitamins, minerals, and performance supplements with clear product information.</p>
      </div>

      <div className="shop-toolbar-title reveal-item"><span><SlidersHorizontal size={18} /> Filter & sort</span><span className="muted">{resultText}</span></div>
      <div className="filters reveal-item reveal-delay-1">
        <label className="search-box"><Search size={18} /><input placeholder="Search protein, vitamin, mineral..." value={search} onChange={(e) => setSearch(e.target.value)} /></label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((cat) => <option key={cat.id} value={cat.slug}>{cat.name}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="featured">Featured</option>
          <option value="newest">Newest</option>
          <option value="price_asc">Price low to high</option>
          <option value="price_desc">Price high to low</option>
        </select>
      </div>

      <div className="product-grid">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="product-card skeleton" style={{ minHeight: '430px', border: 'none' }} />
          ))
        ) : (
          products.map((product, index) => (
            <ProductCard className={`reveal-item reveal-delay-${(index % 4) + 1}`} key={product.id} product={product} navigate={navigate} />
          ))
        )}
      </div>
      {!loading && !products.length && <div className="empty"><h2>No products found</h2><p>Try a different search or category.</p><button className="btn primary" onClick={() => { setSearch(''); setCategory(''); }}>Clear filters</button></div>}
    </section>
  );
}
