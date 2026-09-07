import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CategoryCard from '../../components/CategoryCard';
import api from '../../api';
import './Home.css';

const iconMap = {
  "Meals": "🍛",
  "Biryani": "🍲",
  "Starters": "🍢",
  "Drinks": "☕",
  "Snacks": "🥟",
  "Desserts": "🍨",
  "Juice & Shakes": "🥤",
  "Beverages": "☕",
  "Main Course": "🍲"
};

function Home() {
  const [categoriesList, setCategoriesList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        if (response.data.success) {
          const normalizedCats = response.data.data.map(c => ({
            ...c,
            id: c._id,
            icon: iconMap[c.name] || "🍽️"
          }));
          setCategoriesList(normalizedCats);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="home-page">
<<<<<<< HEAD
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-container">
          <div className="hero-content">
            <h1>Delicious Food,<br/><span>Simple Ordering.</span></h1>
            <p>Experience the best dining from the comfort of your home or right at your table. Fresh ingredients, fast service, and quality food.</p>
            <div className="hero-buttons">
              <Link to="/menu" className="btn btn-primary">Explore Menu</Link>
              <Link to="/orders" className="btn btn-outline">Track Order</Link>
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-image-circle">
               {/* Placeholder for a real food image */}
               <h2>🍲</h2>
=======

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <span className="hero-eyebrow">Authentic South Indian Foods</span>
            <h1>
              Taste the Tradition.<br />
              <span>Order with Ease.</span>
            </h1>
            <p>
              Enjoy a warm, authentic dining experience right from your table.
              Fresh ingredients, bold flavours, and dishes made with care —
              just the way you like it.
            </p>
            <div className="hero-buttons">
              <Link to="/menu" className="btn btn-primary">
                Explore Menu <span>→</span>
              </Link>
              <Link to="/orders" className="btn btn-outline">Track My Order</Link>
            </div>
          </div>

          {/* Decorative circle — visible on large screens */}
          <div className="hero-image">
            <div className="hero-image-circle">
              <span style={{ fontSize: '9rem', lineHeight: 1 }}>🍲</span>
>>>>>>> 137886e9e2ab69827772f95310f4e215a0be8995
            </div>
          </div>
        </div>
      </section>

<<<<<<< HEAD
      {/* Categories Section */}
      <section className="categories-section">
        <div className="container">
          <div className="section-header">
            <h2>Explore Categories</h2>
            <Link to="/menu" className="see-all">See All</Link>
          </div>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#666' }}>Loading categories...</p>
=======
      {/* ── Categories ── */}
      <section className="categories-section">
        <div className="container">
          <div className="section-header">
            <h2>What Would You Like to Eat?</h2>
            <Link to="/menu" className="see-all">View Full Menu →</Link>
          </div>
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--ep-on-surface-variant)' }}>
              Loading categories…
            </p>
>>>>>>> 137886e9e2ab69827772f95310f4e215a0be8995
          ) : (
            <div className="categories-grid">
              {categoriesList.map(category => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}
        </div>
      </section>

<<<<<<< HEAD
      {/* Why Choose Us Section */}
      <section className="features-section glass">
        <div className="container">
          <h2 className="text-center section-title">Why Choose Us</h2>
=======
      {/* ── Features / Why Choose Us ── */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Why Choose SmartServe?</h2>
          <p className="section-subtitle">
            Quality at every step — from our kitchen straight to your table, nothing less.
          </p>
>>>>>>> 137886e9e2ab69827772f95310f4e215a0be8995
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🥬</div>
              <h3>Fresh Ingredients</h3>
<<<<<<< HEAD
              <p>We use only the freshest, high-quality ingredients sourced locally.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Fast Service</h3>
              <p>Quick preparation and delivery so you never have to wait long.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Easy Ordering</h3>
              <p>Order directly from your phone with our seamless digital menu.</p>
=======
              <p>We source vegetables, spices, and produce from local markets daily to ensure every dish is fresh and flavourful.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⏱️</div>
              <h3>Served Hot & Fast</h3>
              <p>Our kitchen team prepares every order fresh. Minimal wait, maximum taste — that is our commitment.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Order from Your Phone</h3>
              <p>Scan the QR at your table, browse the menu, and place your order — no waiting for a waiter needed.</p>
>>>>>>> 137886e9e2ab69827772f95310f4e215a0be8995
            </div>
          </div>
        </div>
      </section>
<<<<<<< HEAD
=======

      {/* ── CTA Strip ── */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Order?</h2>
          <p>
            Fresh dishes are prepared and ready for you. Place your order and enjoy a great meal!
          </p>
          <Link to="/menu" className="btn" style={{
            background: 'var(--ep-surface-container-lowest)',
            color: 'var(--ep-primary)',
            fontWeight: 700,
            padding: '14px 36px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
          }}>
            Start Your Order
          </Link>
        </div>
      </section>

>>>>>>> 137886e9e2ab69827772f95310f4e215a0be8995
    </div>
  );
}

export default Home;
