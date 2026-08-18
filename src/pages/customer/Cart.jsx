import React from 'react';
import { useNavigate } from 'react-router-dom';
import CartItem from '../../components/CartItem';
import { useCart } from '../../context/CartContext';
import './Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeFromCart, subtotal, tax, grandTotal } = useCart();

  const handleIncrease = (id) => {
    const item = cartItems.find(i => i.id === id);
    if (item) updateQuantity(id, item.quantity + 1);
  };

  const handleDecrease = (id) => {
    const item = cartItems.find(i => i.id === id);
    if (item) updateQuantity(id, item.quantity - 1);
  };

  const handleRemove = (id) => {
    removeFromCart(id);
  };

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h1>Your Cart</h1>
        <p>{cartItems.length} items</p>
      </div>

      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <img src="/images/empty-cart.svg" alt="Empty Cart" className="empty-cart-img" onError={(e) => e.target.style.display = 'none'} />
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added any delicious food yet.</p>
          <button className="browse-btn" onClick={() => navigate('/menu')}>
            Browse Menu
          </button>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items-section">
            {cartItems.map(item => (
              <CartItem 
                key={item.id} 
                item={item} 
                onIncrease={handleIncrease}
                onDecrease={handleDecrease}
                onRemove={handleRemove}
              />
            ))}
          </div>

          <div className="cart-summary-section">
            <div className="summary-card">
              <h3>Order Summary</h3>
              
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              
              <div className="summary-row">
                <span>Taxes & Charges (5%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              
              <hr className="summary-divider" />
              
              <div className="summary-row total-row">
                <span>Total Amount</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>

              <div className="summary-actions">
                <button 
                  className="checkout-btn" 
                  onClick={() => navigate('/checkout')}
                >
                  Proceed to Checkout
                </button>
                <button 
                  className="continue-btn" 
                  onClick={() => navigate('/menu')}
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
