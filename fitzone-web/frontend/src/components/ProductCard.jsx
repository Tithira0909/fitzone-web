import React from 'react';
import { ArrowUpRight, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '../utils.js';
import { useCart } from '../context/CartContext.jsx';
import StarRating from './StarRating.jsx';

export default function ProductCard({ product, navigate }) {
  const { addItem } = useCart();
  const coverImage = product.images?.[0] || product.image_url || '/images/multivitamin.svg';

  return (
    <article className="product-card">
      {product.compare_at_price && <span className="sale-badge">Sale</span>}
      <button className="image-wrap" onClick={() => navigate(`/products/${product.slug}`)}>
        <img src={coverImage} alt={product.name} />
      </button>
      <div className="product-info">
        <span className="product-category">{product.category_name}</span>
        <button className="product-title" onClick={() => navigate(`/products/${product.slug}`)}>{product.name}</button>
        <div className="product-meta-row">
          <StarRating value={product.rating} count={product.review_count} />
          <span className="purchase-count">{Number(product.purchase_count || 0).toLocaleString()} purchased</span>
        </div>
        <div className="price-row">
          <div>
            <strong>{formatCurrency(product.price)}</strong>
            {product.compare_at_price && <span>{formatCurrency(product.compare_at_price)}</span>}
          </div>
          <button className="circle-btn" onClick={() => addItem(product)} aria-label="Add to cart"><ShoppingBag size={17} /></button>
        </div>
        <button className="quick-view" onClick={() => navigate(`/products/${product.slug}`)}>View details <ArrowUpRight size={15} /></button>
      </div>
    </article>
  );
}
