import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import { useCart } from '../../context/CartContext';
import './FoodDetails.css';

function FoodDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFood = async () => {
      try {
        const response = await api.get(`/foods/${id}`);
        if (response.data.success) {
          const found = response.data.data;
          setFood({
            ...found,
            id: found._id,
            category: found.category?.name || found.category
          });
        }
      } catch (err) {
        console.error('Error fetching food details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFood();
  }, [id]);

  if (loading) {
    return (
      <div className="container text-center" style={{ padding: '100px 0' }}>
        <h2>Loading Food Details...</h2>
      </div>
    );
  }

  if (!food) {
    return (
      <div className="container text-center" style={{ padding: '100px 0' }}>
        <h2>Food Not Found</h2>
        <p>Sorry, the item you are looking for does not exist.</p>
        <Link to="/menu" className="btn btn-primary" style={{ marginTop: '20px' }}>Back to Menu</Link>
      </div>
    );
  }

  const handleIncrease = () => setQuantity(prev => prev + 1);
  const handleDecrease = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  const handleAddToCart = () => {
    addToCart(food, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="food-details-page container">
      {/* Back Button */}
      <button className="back-btn" onClick={() => navigate('/menu')}>
        ← Back to Menu
      </button>

      <div className="details-container glass">
        {/* Left Side: Image */}
        <div className="details-image-section">
          {/* Fallback pattern if image is missing */}
          <div className="details-image-fallback">🍲</div>
          <img 
            src={food.image} 
            alt={food.name} 
            className="details-image" 
            onError={(e) => e.target.style.display = 'none'} 
          />
        </div>

        {/* Right Side: Information */}
        <div className="details-info-section">
          <div className="details-header">
            <span className="category-badge">{food.category}</span>
            <span className={`availability-badge ${food.available ? 'available' : 'unavailable'}`}>
              {food.available ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>

          <h1 className="details-name">{food.name}</h1>
          <div className="details-rating">⭐ {food.rating} Rating</div>
          
          <p className="details-description">{food.description}</p>
          <div className="details-price">₹{food.price}</div>

          {/* Quantity Selector */}
          <div className="quantity-selector">
            <span className="quantity-label">Quantity:</span>
            <div className="quantity-controls">
              <button onClick={handleDecrease}>-</button>
              <span>{quantity}</span>
              <button onClick={handleIncrease}>+</button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <div className="details-actions">
            <button 
              className="btn btn-primary btn-large" 
              disabled={!food.available}
              onClick={handleAddToCart}
              style={{ backgroundColor: added ? '#2ed573' : undefined }}
            >
              {added ? 'Added to Cart ✓' : `Add ${quantity} to Cart (₹${food.price * quantity})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FoodDetails;
