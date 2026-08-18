import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import './Orders.css';

const Orders = () => {
  const navigate = useNavigate();
  const [ordersList, setOrdersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.get(`/orders?sessionId=${sessionId}`);
        if (response.data.success) {
          const formattedOrders = response.data.data.map(order => ({
            id: order._id,
            date: order.createdAt,
            status: order.status,
            tableNumber: order.session?.table?.tableNumber || '1',
            total: order.total || 0,
            items: order.items || []
          }));
          setOrdersList(formattedOrders);
        } else {
          setError('Failed to fetch orders');
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Helper function to assign classes based on status for styling
  const getStatusClass = (status) => {
    switch((status || '').toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'preparing': return 'status-preparing';
      case 'ready': return 'status-ready';
      case 'served': return 'status-served';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="orders-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '65vh' }}>
        <h3>Loading your orders...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '65vh' }}>
        <h3 style={{ color: '#ff4757' }}>{error}</h3>
        <button className="browse-menu-btn" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1>Your Orders</h1>
        <p>Track your current orders and view past history</p>
      </div>

      {ordersList.length === 0 ? (
        <div className="empty-orders">
          <h2>No orders found</h2>
          <p>You haven't placed any orders yet.</p>
          <button className="browse-menu-btn" onClick={() => navigate('/menu')}>
            Browse Menu
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {ordersList.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-card-header">
                <div>
                  <span className="order-id">Order #{order.id.slice(-6).toUpperCase()}</span>
                  <span className="order-date">
                    {new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <div className={`order-status-badge ${getStatusClass(order.status)}`}>
                  {order.status}
                </div>
              </div>
              
              <div className="order-card-body">
                <div className="order-details-info">
                  <p><strong>Table:</strong> {order.tableNumber}</p>
                  <p><strong>Items:</strong> {order.items.reduce((acc, item) => acc + item.quantity, 0)}</p>
                </div>
                
                <div className="order-price-info">
                  <p className="order-total">₹{order.total.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="order-card-footer">
                <Link to={`/orders/${order.id}`} className="view-details-btn">
                  View Details & Track
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
