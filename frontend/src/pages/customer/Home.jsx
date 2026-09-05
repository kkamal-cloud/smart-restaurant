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
            </div>
          </div>
        </div>
      </section>

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
          ) : (
            <div className="categories-grid">
              {categoriesList.map(category => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Features / Why Choose Us ── */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Why Choose SmartServe?</h2>
          <p className="section-subtitle">
            Quality at every step — from our kitchen straight to your table, nothing less.
          </p>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🥬</div>
              <h3>Fresh Ingredients</h3>
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
            </div>
          </div>
        </div>
      </section>

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

    </div>
  );
}

export default Home;
