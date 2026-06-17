import React, { useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck, Dumbbell, HeartPulse, Leaf, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { api } from '../api/client.js';
import ProductCard from '../components/ProductCard.jsx';

const categoryIcons = [Dumbbell, ShieldCheck, HeartPulse, Sparkles, Leaf];

export default function Home({ navigate }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [hero, setHero] = useState({ desktop_video_url: '', mobile_video_url: '' });

  useEffect(() => {
    Promise.all([api('/products?sort=featured'), api('/categories'), api('/hero')])
      .then(([productData, categoryData, heroData]) => {
        setProducts(productData.products.slice(0, 8));
        setCategories(categoryData.categories.slice(0, 5));
        setHero(heroData.hero);
      })
      .catch(console.error);
  }, []);

  return (
    <>
      <section className="hero">
        <div className="container hero-shell">
          <div className="hero-copy">
            <span className="eyebrow light"><span className="pulse-dot" /> Built for your strongest self</span>
            <h1>Fuel better.<br /><em>Live stronger.</em></h1>
            <p>Premium vitamins and performance supplements, carefully selected to support the work you put in every day.</p>
            <div className="hero-actions">
              <button className="btn lime" onClick={() => navigate('/products')}>Shop all products <ArrowRight size={18} /></button>
              <button className="btn dark-ghost" onClick={() => navigate('/products?category=daily-essentials')}>Explore essentials</button>
            </div>
            <div className="hero-proof">
              <div><strong>100%</strong><span>Authentic products</span></div>
              <div><strong>2–4 days</strong><span>Islandwide delivery</span></div>
              <div><strong>4.9/5</strong><span>Customer rating</span></div>
            </div>
          </div>
          <div className="hero-visual">
            {(hero.desktop_video_url || hero.mobile_video_url) ? (
              <video className="hero-video" key={`${hero.desktop_video_url}-${hero.mobile_video_url}`} autoPlay muted loop playsInline poster="/images/fit-zone-hero.png">
                {hero.mobile_video_url && <source src={hero.mobile_video_url} media="(max-width: 850px)" />}
                {hero.desktop_video_url && <source src={hero.desktop_video_url} media="(min-width: 851px)" />}
                <source src={hero.desktop_video_url || hero.mobile_video_url} />
              </video>
            ) : <img src="/images/fit-zone-hero.png" alt="Premium Fit Zone Nutrition supplement collection" />}
            <div className="hero-badge"><BadgeCheck size={22} /><span><strong>Quality checked</strong>Every product, every batch</span></div>
          </div>
        </div>
      </section>

      <section className="trust-strip">
        <div className="container trust-grid">
          <div><ShieldCheck /><span><strong>Authenticity guaranteed</strong><small>Sourced from trusted suppliers</small></span></div>
          <div><Truck /><span><strong>Fast islandwide delivery</strong><small>Free over LKR 15,000</small></span></div>
          <div><BadgeCheck /><span><strong>Quality-first selection</strong><small>Products we stand behind</small></span></div>
          <div><HeartPulse /><span><strong>Real customer support</strong><small>Help choosing your routine</small></span></div>
        </div>
      </section>

      <section className="container category-section">
        <div className="section-head">
          <div><span className="eyebrow">Shop by goal</span><h2>Find what fits your routine.</h2></div>
          <button className="text-link" onClick={() => navigate('/products')}>View all products <ArrowRight size={17} /></button>
        </div>
        <div className="category-grid">
          {categories.map((category, index) => {
            const Icon = categoryIcons[index % categoryIcons.length];
            return (
              <button className="category-card" key={category.id} onClick={() => navigate(`/products?category=${category.slug}`)}>
                <span className="category-icon"><Icon /></span>
                <span><strong>{category.name}</strong><small>{category.product_count || 0} products</small></span>
                <ArrowRight className="category-arrow" size={18} />
              </button>
            );
          })}
        </div>
      </section>

      <section className="products-band">
        <div className="container">
          <div className="section-head">
            <div><span className="eyebrow">Customer favorites</span><h2>Performance starts here.</h2><p>Everyday staples and focused formulas for your next level.</p></div>
            <button className="text-link" onClick={() => navigate('/products')}>Shop the collection <ArrowRight size={17} /></button>
          </div>
          <div className="product-grid">
            {products.map((product) => <ProductCard key={product.id} product={product} navigate={navigate} />)}
          </div>
        </div>
      </section>

      <section className="container split-promo">
        <div className="promo-content">
          <span className="eyebrow light">Daily foundations</span>
          <h2>Small habits.<br />Serious consistency.</h2>
          <p>Build a simple daily stack with vitamins, minerals, and essential nutrients that work around your schedule.</p>
          <button className="btn lime" onClick={() => navigate('/products?category=daily-essentials')}>Build your routine <ArrowRight size={18} /></button>
        </div>
        <div className="promo-products">
          <img src="/images/multivitamin.svg" alt="Daily multivitamin" />
          <img src="/images/omega3.svg" alt="Omega 3 supplement" />
          <div className="promo-circle">Daily<br /><strong>essentials</strong></div>
        </div>
      </section>

      <section className="container journal-strip">
        <span>FIT ZONE STANDARD</span>
        <h2>Better products. Clear information. No shortcuts.</h2>
        <p>We make supplement shopping simpler with straightforward product details, transparent pricing, and support when you need it.</p>
      </section>
    </>
  );
}
