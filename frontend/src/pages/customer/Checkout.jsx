import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../api';
import { formatOrderNumber } from '../../utils/numberFormatters';
import './Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, subtotal, tax, grandTotal, clearCart } = useCart();

  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    tableNumber: '',
    specialInstructions: ''
  });

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) return;
      try {
        const response = await api.get(`/sessions/${sessionId}`);
        if (response.data.success) {
          const session = response.data.data;
          
          // Try to match the current customer from localStorage to retrieve details
          const savedCustomerStr = localStorage.getItem('customer');
          let currentCustomer = {};
          if (savedCustomerStr) {
            try {
              const savedCustomer = JSON.parse(savedCustomerStr);
              currentCustomer = session.customerIds?.find(c => c._id === savedCustomer.id) || savedCustomer;
            } catch (e) {
              console.error(e);
            }
          }

          setFormData(prev => ({
            ...prev,
            customerName: currentCustomer.name || prev.customerName,
            phoneNumber: currentCustomer.phone || prev.phoneNumber,
            tableNumber: session.table?.tableNumber?.toString() || prev.tableNumber
          }));
        }
      } catch (err) {
        console.error('Error fetching session details:', err);
      }
    };
    fetchSession();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      alert('No active session found. Please scan table QR code to start dining.');
      return;
    }

    try {
      const payload = {
        sessionId,
        items: cartItems.map(item => ({
          foodId: item.id,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions || ''
        })),
        specialInstructions: formData.specialInstructions || ''
      };

      const response = await api.post('/orders', payload);

      if (response.data.success) {
        const createdOrder = response.data.data;
        const formattedNum = formatOrderNumber(createdOrder.orderNumber, createdOrder._id);
        const orderData = {
          id: createdOrder._id,
          orderNumber: createdOrder.orderNumber,
          token: formattedNum,
          customerName: formData.customerName || 'Customer',
          phoneNumber: formData.phoneNumber,
          tableNumber: formData.tableNumber || '1',
          items: (createdOrder.items || []).map(item => ({
            id: item._id,
            name: item.food?.name || item.name || 'Item',
            price: item.priceAtOrderTime || item.price || 0,
            quantity: item.quantity || 1
          })),
          subtotal: createdOrder.subtotal || subtotal || 0,
          tax: createdOrder.tax || tax || 0,
          total: createdOrder.total || grandTotal || 0,
          date: createdOrder.createdAt || new Date().toISOString()
        };
        setCompletedOrder(orderData);
        setOrderPlaced(true);
        clearCart();
      } else {
        alert('Failed to place order.');
      }
    } catch (err) {
      console.error('Error placing order:', err);
      alert(err.response?.data?.error?.message || err.message || 'Failed to place order');
    }
  };


  const shareOnWhatsApp = () => {
    if (!completedOrder) return;
    const formattedNum = formatOrderNumber(completedOrder.orderNumber, completedOrder.id);
    const text = `*SmartServe Order Confirmation*\n` +
                 `Order ID: ${formattedNum}\n` +
                 `Token: ${completedOrder.token}\n` +
                 `Table: ${completedOrder.tableNumber}\n` +
                 `Total Amount: ₹${completedOrder.total.toFixed(0)}\n` +
                 `Status: Placed successfully!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (orderPlaced && completedOrder) {
    return (
      <div className="order-placed-container">
        <div className="order-placed-card">
          <div className="placed-icon">✓</div>
          <h2 className="placed-title">Order Placed!</h2>
          <p className="placed-order-id">{formatOrderNumber(completedOrder.orderNumber, completedOrder.id)}</p>

          {/* Token Card */}
          <div className="token-banner-box">
            <span className="token-label">YOUR TOKEN</span>
            <h1 className="token-number">{completedOrder.token}</h1>
          </div>

          {/* Order Summary */}
          <div className="placed-summary-box">
            <h4>Order Summary</h4>
            {completedOrder.items.map((item, idx) => (
              <div key={idx} className="placed-summary-row">
                <span>{item.name}</span>
                <span className="item-meta">x{item.quantity}  ₹{item.price * item.quantity}</span>
              </div>
            ))}
            <hr className="summary-hr" />
            <div className="placed-summary-row">
              <span>Subtotal</span>
              <span>₹{completedOrder.subtotal.toFixed(0)}</span>
            </div>
            <div className="placed-summary-row">
              <span>Tax (GST 5%)</span>
              <span>₹{completedOrder.tax.toFixed(0)}</span>
            </div>
            <div className="placed-summary-row total-row">
              <strong>Total to Pay</strong>
              <strong>₹{completedOrder.total.toFixed(0)}</strong>
            </div>
          </div>

          {/* QR Code Verification */}
          <div className="qr-verification-box">
            <QRCodeSVG 
              value={`${import.meta.env.VITE_APP_URL || window.location.origin}/bill/${completedOrder.id}`}
              size={140}
              level="H"
            />
            <p className="qr-hint">Scan to view your bill</p>
            <span className="qr-subhint">Show this to staff or scan later</span>
          </div>

          {/* Actions */}
          <div className="placed-actions">
            <button className="whatsapp-share-btn" onClick={shareOnWhatsApp}>
              💬 Share on WhatsApp
            </button>
            <button className="back-menu-btn" onClick={() => navigate('/menu')}>
              🔙 Back to Menu
            </button>
          </div>

          <p className="pay-counter-note">💵 Please pay: Pay at the counter after receiving order</p>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h1>Your Order</h1>
        <p>{cartItems.length} items in cart</p>
      </div>

      <div className="checkout-content">
        <div className="checkout-form-section">
          <form className="checkout-form" onSubmit={handlePlaceOrder}>
            <h2>Your Details</h2>
            
            <div className="form-group">
              <label htmlFor="customerName">Your Name *</label>
              <input 
                type="text" 
                id="customerName" 
                name="customerName" 
                value={formData.customerName} 
                onChange={handleInputChange} 
                placeholder="Enter your name" 
                required 
              />
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number (optional)</label>
              <input 
                type="tel" 
                id="phoneNumber" 
                name="phoneNumber" 
                value={formData.phoneNumber} 
                onChange={handleInputChange} 
                placeholder="Enter phone number" 
              />
            </div>

            <div className="form-group">
              <label htmlFor="tableNumber">Table Number (optional)</label>
              <input 
                type="text" 
                id="tableNumber" 
                name="tableNumber" 
                value={formData.tableNumber} 
                onChange={handleInputChange} 
                placeholder="e.g. T1" 
              />
            </div>

            <div className="form-group">
              <label htmlFor="specialInstructions">Special Instructions (optional)</label>
              <textarea 
                id="specialInstructions" 
                name="specialInstructions" 
                value={formData.specialInstructions} 
                onChange={handleInputChange} 
                placeholder="Any allergies or preferences?" 
                rows="3"
              ></textarea>
            </div>

            <div className="bill-summary-box">
              <h3>Bill Summary</h3>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(0)}</span>
              </div>
              <div className="summary-row">
                <span>Tax (GST 5%)</span>
                <span>₹{tax.toFixed(0)}</span>
              </div>
              <hr />
              <div className="summary-row total-row">
                <span>Total to Pay</span>
                <span>₹{grandTotal.toFixed(0)}</span>
              </div>
              <p className="pay-counter-badge">💵 Pay at counter after receiving order</p>
            </div>

            <button type="submit" className="place-order-btn-red" disabled={cartItems.length === 0}>
              Place Order →
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
