import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../api';
import './Navbar.css';

function Navbar() {
  const { totalItems } = useCart();
  const location = useLocation();
  const [pin, setPin] = useState(localStorage.getItem('joinPin') || '');
  const [tableNo, setTableNo] = useState('');

  useEffect(() => {
    const sessionId = localStorage.getItem('sessionId');
    const storedPin = localStorage.getItem('joinPin');
    if (storedPin) {
      setPin(storedPin);
    }

    if (sessionId) {
      api.get(`/sessions/${sessionId}`)
        .then(res => {
          if (res.data?.success) {
            const sess = res.data.data;
            if (sess.joinPin) {
              setPin(sess.joinPin);
              localStorage.setItem('joinPin', sess.joinPin);
            }
            if (sess.table?.tableNumber) {
              setTableNo(sess.table.tableNumber);
            }
          }
        })
        .catch(err => console.log('Session info fetch error:', err));
    } else {
      setPin('');
      setTableNo('');
    }
  }, [location.pathname]);

  const isScanPage = location.pathname.startsWith('/scan');

  return (
    <nav className="navbar">
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
        <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {!isScanPage && pin && (
            <span 
              title="Table PIN for friends to join your single bill"
              style={{
                fontSize: '0.85rem',
                background: 'rgba(214, 158, 46, 0.15)',
                color: '#b7791f',
                padding: '5px 12px',
                borderRadius: '16px',
                fontWeight: '700',
                border: '1px solid rgba(214, 158, 46, 0.3)',
                letterSpacing: '1px'
              }}
            >
              {tableNo ? `Table ${tableNo} • ` : ''}🔑 PIN: {pin}
            </span>
          )}

          <Link to="/cart" className="cart-icon">
            🛒 <span className="cart-badge">{totalItems}</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
