import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FoodCard from '../../components/FoodCard';
import api from '../../api';
import { useCart } from '../../context/CartContext';
import './Menu.css';

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

function Menu() {
  const navigate = useNavigate();
  const { totalItems, grandTotal } = useCart();

  const [foodsList, setFoodsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dietFilter, setDietFilter] = useState('All'); // 'All', 'Veg', 'Non-Veg'

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        const [foodsRes, categoriesRes] = await Promise.all([
          api.get('/foods'),
          api.get('/categories')
        ]);

        if (foodsRes.data.success) {
          const normalizedFoods = foodsRes.data.data.map(f => ({
            ...f,
            id: f._id,
            category: f.category?.name || f.category
          }));
          setFoodsList(normalizedFoods);
        } else {
          setError('Unable to load foods');
        }

        if (categoriesRes.data.success) {
          const normalizedCats = categoriesRes.data.data.map(c => ({
            ...c,
            id: c._id,
            icon: iconMap[c.name] || "🍽️"
          }));
          setCategoriesList(normalizedCats);
        }
      } catch (err) {
        console.error('Error fetching menu from API:', err);
        setError('Unable to load menu');
      } finally {
        setLoading(false);
      }
    };

    fetchMenuData();
  }, []);

  // Filter foods based on search, category, and veg/non-veg diet
  const filteredFoods = foodsList.filter((food) => {
    const matchesSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (food.description && food.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || food.category === selectedCategory;
    const matchesDiet = dietFilter === 'All' || 
                        (dietFilter === 'Veg' && food.isVeg) || 
                        (dietFilter === 'Non-Veg' && !food.isVeg);
    return matchesSearch && matchesCategory && matchesDiet;
  });

  if (loading) {
    return (
      <div className="dine-pos-menu-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <h3>Loading menu...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dine-pos-menu-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <h3 style={{ color: '#ff4757' }}>{error}</h3>
        <button className="dine-reset-btn" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="dine-pos-menu-container">
      {/* Top Banner Header */}
      <div className="dine-top-header">
        <div className="header-info">
          <h1 className="restaurant-title">SmartServe</h1>
          <span className="menu-subtitle">{foodsList.length} Items | {categoriesList.length} Categories</span>
        </div>

        {/* Veg / Non-Veg Toggle Filter Buttons */}
        <div className="diet-toggle-group">
          <button 
            className={`diet-pill-btn ${dietFilter === 'All' ? 'active' : ''}`}
            onClick={() => setDietFilter('All')}
          >
            All
          </button>
          <button 
            className={`diet-pill-btn veg ${dietFilter === 'Veg' ? 'active' : ''}`}
            onClick={() => setDietFilter('Veg')}
          >
            Veg
          </button>
          <button 
            className={`diet-pill-btn non-veg ${dietFilter === 'Non-Veg' ? 'active' : ''}`}
            onClick={() => setDietFilter('Non-Veg')}
          >
            Non-Veg
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="dine-search-box">
        <span className="search-icon">🔍</span>
        <input 
          type="text" 
          placeholder="Search dishes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="dine-search-input"
        />
        {searchQuery && (
          <button className="clear-search-btn" onClick={() => setSearchQuery('')}>✕</button>
        )}
      </div>

      {/* Horizontal Category Scroll Bar */}
      <div className="category-scroll-wrapper">
        <button 
          className={`category-chip ${selectedCategory === 'All' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('All')}
        >
          🍽️ All
        </button>
        {categoriesList.map(cat => (
          <button 
            key={cat.id} 
            className={`category-chip ${selectedCategory === cat.name ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.name)}
          >
            <span className="chip-icon">{cat.icon}</span> {cat.name}
          </button>
        ))}
      </div>

      {/* Food Grid Display */}
      {filteredFoods.length > 0 ? (
        <div className="dine-food-grid">
          {filteredFoods.map(food => (
            <FoodCard key={food.id} food={food} />
          ))}
        </div>
      ) : (
        <div className="dine-no-results">
          <h3>No dishes found</h3>
          <p>We couldn't find anything matching your filters.</p>
          <button 
            className="dine-reset-btn" 
            onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setDietFilter('All'); }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Floating Bottom Navigation / Cart Banner */}
      {totalItems > 0 && (
        <div className="floating-cart-banner" onClick={() => navigate('/cart')}>
          <div className="cart-banner-left">
            <span className="cart-item-count">{totalItems} {totalItems === 1 ? 'item' : 'items'} added</span>
          </div>
          <div className="cart-banner-right">
            <span className="cart-total-price">₹{grandTotal.toFixed(0)}</span>
            <span className="cart-nav-arrow">🛒 View Cart →</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Menu;
