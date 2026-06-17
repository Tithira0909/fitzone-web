import React, { useEffect, useState } from 'react';
import { BadgeCheck, ChevronRight, Minus, Plus, RotateCcw, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { api } from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency } from '../utils.js';
import { ProductDescriptionViewer } from '../components/ProductDescription.jsx';
import StarRating from '../components/StarRating.jsx';
import RatingInput from '../components/RatingInput.jsx';
import useScrollReveal from '../hooks/useScrollReveal.js';

export default function ProductDetails({ slug, navigate }) {
  const revealRef = useScrollReveal();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState('');
  const [error, setError] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const { addItem } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    api(`/products/${slug}`).then((data) => {
      setProduct(data.product);
      setActiveImage(data.product.images?.[0] || data.product.image_url || '/images/multivitamin.svg');
      const ownReview = data.product.reviews?.find((review) => review.user_id === user?.id);
      setReviewRating(Number(ownReview?.rating || 0));
      setReviewText(ownReview?.review_text || '');
    }).catch((err) => setError(err.message));
  }, [slug, user?.id]);

  async function submitReview(event) {
    event.preventDefault();
    setReviewError('');
    setReviewMessage('');
    if (!reviewRating) {
      setReviewError('Choose a star rating first.');
      return;
    }
    setSubmittingReview(true);
    try {
      const data = await api(`/products/${product.id}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating: reviewRating, review_text: reviewText })
      });
      setProduct((current) => {
        const reviews = current.reviews || [];
        const nextReviews = [data.review, ...reviews.filter((review) => review.user_id !== data.review.user_id)];
        return { ...current, ...data.summary, reviews: nextReviews };
      });
      setReviewMessage('Your rating has been saved.');
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setSubmittingReview(false);
    }
  }

  if (error) return <section className="container empty"><h2>Product unavailable</h2><p>{error}</p><button className="btn primary" onClick={() => navigate('/products')}>Back to shop</button></section>;
  if (!product) return <section className="container empty"><p>Loading product...</p></section>;

  return (
    <div ref={revealRef}>
      <div className="container breadcrumbs reveal-item"><button onClick={() => navigate('/')}>Home</button><ChevronRight /><button onClick={() => navigate('/products')}>Shop</button><ChevronRight /><span>{product.name}</span></div>
      <section className="container detail-grid">
        <div className="detail-gallery reveal-item">
          <div className="detail-image">
            <span className="detail-image-label">FIT ZONE SELECT</span>
            <img key={activeImage} className="zoom-fade-anim" src={activeImage} alt={product.name} />
          </div>
          {product.images?.length > 1 && (
            <div className="gallery-thumbnails">
              {product.images.map((image, index) => (
                <button className={activeImage === image ? 'active' : ''} key={`${image}-${index}`} onClick={() => setActiveImage(image)} aria-label={`View image ${index + 1}`}>
                  <img src={image} alt="" />
                </button>
              ))}
            </div>
          )}
          <div className="detail-trust"><span><BadgeCheck /> Authentic product</span><span><ShieldCheck /> Quality checked</span></div>
        </div>
        <div className="detail-info reveal-item reveal-delay-2">
          <span className="product-category">{product.category_name}</span>
          <h1>{product.name}</h1>
          <div className="detail-rating"><StarRating value={product.rating} count={product.review_count} size={18} /></div>
          <div className="detail-price">{formatCurrency(product.price)} {product.compare_at_price && <span>{formatCurrency(product.compare_at_price)}</span>}</div>
          <ProductDescriptionViewer value={product.description} />
          <div className="stock-line"><span className={product.stock > 0 ? 'stock-dot' : 'stock-dot out'} />{product.stock > 0 ? `In stock · ${product.stock} available` : 'Out of stock'}</div>
          <div className="purchase-count detail-purchase-count">{Number(product.purchase_count || 0).toLocaleString()} purchased</div>
          <div className="buy-row">
            <div className="qty-control">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity"><Minus size={16} /></button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} aria-label="Increase quantity"><Plus size={16} /></button>
            </div>
            <button className="btn primary detail-add" onClick={() => addItem(product, quantity)} disabled={product.stock < 1}>
              <ShoppingBag size={18} /> Add to cart
            </button>
          </div>
          <div className="purchase-benefits">
            <div><Truck /><span><strong>Fast delivery</strong><small>2–4 business days</small></span></div>
            <div><RotateCcw /><span><strong>Easy support</strong><small>Contact us about any issue</small></span></div>
          </div>
          <div className="detail-accordion">
            <details open><summary>Ingredients</summary><p>{product.ingredients || 'See the product label for full ingredients.'}</p></details>
            <details><summary>How to use</summary><p>{product.usage_notes || 'Use only as directed on the product label.'}</p></details>
            <details><summary>Important information</summary><p>Consult a healthcare professional before use if you are pregnant, nursing, using medication, or have a medical condition.</p></details>
          </div>
        </div>
      </section>
      <section className="container reviews-section reveal-item">
        <div className="reviews-heading">
          <div><span className="eyebrow">Customer feedback</span><h2>Ratings & reviews</h2></div>
          <StarRating value={product.rating} count={product.review_count} size={20} />
        </div>
        <div className="reviews-grid">
          <div className="review-form-card">
            <h3>{user ? 'Rate this product' : 'Sign in to rate this product'}</h3>
            {user ? (
              <form onSubmit={submitReview}>
                <p>Signed in as <strong>{user.name}</strong>. You can update your rating at any time.</p>
                <RatingInput value={reviewRating} onChange={setReviewRating} />
                <label>Review <small>(optional)</small><textarea rows="4" maxLength="1000" value={reviewText} onChange={(event) => setReviewText(event.target.value)} placeholder="How was your experience with this product?" /></label>
                {reviewError && <div className="alert error">{reviewError}</div>}
                {reviewMessage && <div className="alert success">{reviewMessage}</div>}
                <button className="btn primary" disabled={submittingReview}>{submittingReview ? 'Saving...' : 'Submit rating'}</button>
              </form>
            ) : (
              <><p>Log in or create an account to leave a star rating and review.</p><button className="btn lime" onClick={() => navigate('/login')}>Log in to rate</button></>
            )}
          </div>
          <div className="review-list">
            {product.reviews?.length ? product.reviews.map((review) => (
              <article className="review-card" key={review.id}>
                <div><strong>{review.customer_name}</strong><StarRating value={review.rating} showValue={false} /></div>
                {review.review_text && <p>{review.review_text}</p>}
                <small>{new Date(review.updated_at || review.created_at).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' })}</small>
              </article>
            )) : <div className="review-empty"><h3>No reviews yet</h3><p>Be the first customer to rate this product.</p></div>}
          </div>
        </div>
      </section>
    </div>
  );
}
