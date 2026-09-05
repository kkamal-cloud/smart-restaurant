import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-section">
          <h3>Smart<span>Serve</span></h3>
          <p>Authentic South Indian food, served fresh and fast. Order right from your table and enjoy a great dining experience.</p>
        </div>
        
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/menu">Menu</a></li>
            <li><a href="/orders">Track Order</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>Contact Us</h4>
          <p>📍 52C South Street, Sivakasi</p>
          <p>📞 +91 8300726696</p>
          <p>✉️ SmartServe@gmail.com</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} SmartServe. All Rights Reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
