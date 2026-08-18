import React from 'react';
import './CartItem.css';

const CartItem = ({ item, onIncrease, onDecrease, onRemove }) => {
  return (
    <div className="cart-item-card">
      <div className="cart-item-image">
        <img src={item.image} alt={item.name} />
      </div>
      
      <div className="cart-item-details">
        <h3 className="cart-item-name">{item.name}</h3>
        <p className="cart-item-price">₹{item.price}</p>
      </div>

      <div className="cart-item-actions">
        <div className="quantity-control">
          <button 
            className="qty-btn" 
            onClick={() => onDecrease(item.id)}
            disabled={item.quantity <= 1}
          >
            -
          </button>
          <span className="qty-display">{item.quantity}</span>
          <button 
            className="qty-btn" 
            onClick={() => onIncrease(item.id)}
          >
            +
          </button>
        </div>
        
        <div className="cart-item-subtotal">
          ₹{item.price * item.quantity}
        </div>

        <button className="remove-btn" onClick={() => onRemove(item.id)}>
          ✕
        </button>
      </div>
    </div>
  );
};

export default CartItem;
