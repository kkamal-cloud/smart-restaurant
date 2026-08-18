import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Navbar.css';

function Navbar() {
  const { totalItems } = useCart();

  return (
    <nav className="navbar glass">
      <div className="container navbar-container">
        {/* Logo Section */}
        <Link to="/" className="navbar-logo">
          Smart<span>Serve</span>
        </Link>

        {/* Navigation Links */}
        <ul className="navbar-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/menu">Menu</Link></li>
          <li><Link to="/orders">Orders</Link></li>
        </ul>

        {/* Action Buttons */}
        <div className="navbar-actions">
          <Link to="/cart" className="cart-icon">
            🛒 <span className="cart-badge">{totalItems}</span>
          </Link>
          <Link to="/admin/login" className="btn btn-primary">Login</Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
