import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import socket from '../../socket';
import { formatOrderNumber } from '../../utils/numberFormatters';
import './OrderDetails.css';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await api.get(`/orders/${id}`);
        if (response.data.success) {
          const found = response.data.data;
          
          // Get current customer name from customerIds or localStorage
          const savedCustomer = JSON.parse(localStorage.getItem('customer') || '{}');
          const customerName = found.session?.customerIds?.map(c => c.name).join(', ') || savedCustomer.name || 'Customer';

          const formatted = {
            id: found._id,
            orderNumber: found.orderNumber,
            date: found.createdAt,
            status: found.status,
            customerName: customerName,
            tableNumber: found.session?.table?.tableNumber || '1',
            items: (found.items || []).map(item => ({
              id: item._id,
              name: item.food?.name || 'Item',
              price: item.priceAtOrderTime || 0,
              quantity: item.quantity
            })),
            subtotal: found.subtotal || 0,
            tax: found.tax || 0,
            total: found.total || 0
          };
          setOrder(formatted);
        }
      } catch (err) {
        console.error('Error fetching order details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();

    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      socket.emit('joinSession', sessionId);
    }

    const handleStatusUpdate = ({ orderId, status }) => {
      if (orderId === id) {
        setOrder(prev => (prev ? { ...prev, status } : prev));
      }
    };

    socket.on('order:statusUpdate', handleStatusUpdate);

    return () => {
      socket.off('order:statusUpdate', handleStatusUpdate);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="order-details-loading">
        <h2>Loading Order Details...</h2>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-details-loading">
        <h2>Order Not Found</h2>
        <button onClick={() => navigate('/orders')} className="back-btn">Back to Orders</button>
      </div>
    );
  }

  // Define the status steps
  const statusSteps = ['Pending', 'Preparing', 'Ready', 'Served'];
  
  // Find current step index (returns 0 to 3, or -1 if not found)
  const currentStepIndex = statusSteps.findIndex(
    step => step.toLowerCase() === order.status.toLowerCase()
  );

  return (
    <div className="order-details-container">
      <div className="order-details-header">
        <Link to="/orders" className="back-link">← Back to Orders</Link>
        <h1>Order {formatOrderNumber(order.orderNumber, order.id)}</h1>
        <p>{new Date(order.date).toLocaleString()}</p>
      </div>


      {/* Visual Status Tracker */}
      <div className="status-tracker">
        {statusSteps.map((step, index) => {
          let stepClass = "status-step";
          if (index < currentStepIndex) stepClass += " completed";
          if (index === currentStepIndex) stepClass += " active";

          return (
            <div key={step} className={stepClass}>
              <div className="step-circle">{index + 1}</div>
              <div className="step-label">{step}</div>
            </div>
          );
        })}
      </div>

      <div className="order-details-content">
        <div className="order-info-card">
          <h2>Customer Info</h2>
          <p><strong>Name:</strong> {order.customerName}</p>
          <p><strong>Table:</strong> {order.tableNumber}</p>
          <p><strong>Current Status:</strong> <span className={`status-text ${order.status.toLowerCase()}`}>{order.status}</span></p>
        </div>

        <div className="order-items-card">
          <h2>Order Items</h2>
          <div className="items-list">
            {order.items.map(item => (
              <div key={item.id} className="item-row">
                <div className="item-name-qty">
                  <span className="qty">{item.quantity}x</span>
                  <span>{item.name}</span>
                </div>
                <div className="item-price">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <hr className="divider" />

          <div className="summary-section">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Tax (5%)</span>
              <span>₹{order.tax.toFixed(2)}</span>
            </div>
            <div className="summary-row total-row">
              <span>Total</span>
              <span>₹{order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {order.status.toLowerCase() === 'served' && (
        <div className="bill-action">
          <button className="view-bill-btn" onClick={() => navigate(`/bill/${order.id}`)}>
            View Final Bill
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
