import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './FoodCard.css';

function FoodCard({ food }) {
  const { cartItems, addToCart, updateQuantity } = useCart();
  
  const cartItem = cartItems.find(i => i.id === food.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const handleAdd = () => {
    addToCart(food, 1);
  };

  const handleIncrease = () => {
    updateQuantity(food.id, quantity + 1);
  };

  const handleDecrease = () => {
    updateQuantity(food.id, quantity - 1);
  };

  return (
    <div className="food-card">
      <div className="food-image-wrapper">
        <img 
          src={food.image} 
          alt={food.name} 
          className="food-image" 
          onError={(e) => e.target.style.display = 'none'} 
        />
        {food.isPopular && (
          <div className="popular-badge">🔥 Popular</div>
        )}
      </div>

      <div className="food-info">
        <div className="food-header-row">
          <span className={`diet-icon ${food.isVeg ? 'veg' : 'non-veg'}`}>
            <span className="dot"></span>
          </span>
          <h3 className="food-name">{food.name}</h3>
        </div>

        {food.description && (
          <p className="food-description">{food.description}</p>
        )}

        <div className="food-footer-row">
          <span className="food-price">₹{food.price}</span>

          <div className="food-action-container">
            {quantity > 0 ? (
              <div className="qty-control-inline">
                <button className="qty-btn" onClick={handleDecrease}>-</button>
                <span className="qty-num">{quantity}</span>
                <button className="qty-btn" onClick={handleIncrease}>+</button>
              </div>
            ) : (
              <button className="add-btn-red" onClick={handleAdd}>
                + ADD
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FoodCard;
