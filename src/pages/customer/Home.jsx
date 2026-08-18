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
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <div className="container">
          <div className="section-header">
            <h2>Explore Categories</h2>
            <Link to="/menu" className="see-all">See All</Link>
          </div>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#666' }}>Loading categories...</p>
          ) : (
            <div className="categories-grid">
              {categoriesList.map(category => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="features-section glass">
        <div className="container">
          <h2 className="text-center section-title">Why Choose Us</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🥬</div>
              <h3>Fresh Ingredients</h3>
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
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
