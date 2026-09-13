import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import socket from '../../socket';
import { clearStaffAuth } from '../../utils/authStorage';
import { formatOrderNumber } from '../../utils/numberFormatters';
import './KitchenDashboard.css';

const KitchenDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  // Fetch orders from backend API
  const fetchOrders = async () => {
    try {
      const response = await api.get('/kitchen/orders?status=all');
      if (response.data && response.data.data) {
        setOrders(response.data.data);
        setIsLive(true);
      }
    } catch (err) {
      console.error('Backend API connection failed:', err.message);
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    socket.emit('joinKitchen');

    const handleNewOrder = (newOrder) => {
      setOrders(prev => {
        const id = newOrder._id || newOrder.id;
        const exists = prev.some(o => (o._id || o.id) === id);
        if (exists) return prev;
        return [newOrder, ...prev];
      });
      setIsLive(true);
    };

    const handleStatusUpdate = ({ orderId, status }) => {
      setOrders(prev =>
        prev.map(o => {
          const id = o._id || o.id;
          return id === orderId ? { ...o, status: status.toLowerCase() } : o;
        })
      );
    };

    socket.on('order:new', handleNewOrder);
    socket.on('order:statusUpdate', handleStatusUpdate);

    const interval = setInterval(fetchOrders, 10000);

    return () => {
      socket.off('order:new', handleNewOrder);
      socket.off('order:statusUpdate', handleStatusUpdate);
      clearInterval(interval);
    };
  }, []);

  // Helper to change order status in API & local state
  const updateOrderStatus = async (orderId, newStatus) => {
    // Optimistic UI update
    setOrders(prevOrders => 
      prevOrders.map(order => {
        const id = order._id || order.id;
        return id === orderId ? { ...order, status: newStatus.toLowerCase() } : order;
      })
    );

    try {
      await api.patch(`/kitchen/orders/${orderId}/status`, { status: newStatus.toLowerCase() });
    } catch (err) {
      console.error('Failed to update status on server:', err.message);
      // Re-fetch to ensure sync
      fetchOrders();
    }
  };

  // Helper to filter orders by status
  const getOrdersByStatus = (status) => {
    return orders.filter(order => (order.status || '').toLowerCase() === status.toLowerCase());
  };

  // Sub-component for rendering a column
  const Column = ({ title, statusFilter, nextActionText, nextStatus, nextActionClass }) => {
    const columnOrders = getOrdersByStatus(statusFilter);

    return (
      <div className="kitchen-column">
        <div className={`column-header header-${statusFilter.toLowerCase()}`}>
          <h2>{title}</h2>
          <span className="count-badge">{columnOrders.length}</span>
        </div>
        
        <div className="column-content">
          {columnOrders.length === 0 ? (
            <div className="empty-column">No orders</div>
          ) : (
            columnOrders.map(order => {
              const orderId = order._id || order.id;
              const displayId = formatOrderNumber(order.orderNumber, orderId);
              const tableNum = order.session?.table?.tableNumber || order.tableNumber || 'N/A';
              const orderTime = order.createdAt || order.date;

              return (
                <div key={orderId} className="kitchen-order-card">
                  <div className="k-order-header">
                    <span className="k-order-id">{displayId}</span>
                    <span className="k-table-number">Table {tableNum}</span>
                  </div>
                  
                  <div className="k-order-time">
                    ⏱️ {new Date(orderTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  
                  <ul className="k-order-items">
                    {(order.items || []).map((item, idx) => {
                      const itemName = item.food?.name || item.name || 'Item';
                      return (
                        <li key={idx}>
                          <span className="item-qty">{item.quantity}x</span> {itemName}
                          {item.specialInstructions && (
                            <div style={{ fontSize: '0.8rem', color: '#ff6b6b', marginTop: '2px' }}>
                              ⚠️ {item.specialInstructions}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  {order.specialInstructions && (
                    <div style={{ fontSize: '0.85rem', background: 'rgba(255, 107, 107, 0.15)', color: '#ff6b6b', padding: '6px 10px', borderRadius: '6px', marginBottom: '10px' }}>
                      📌 Note: {order.specialInstructions}
                    </div>
                  )}
                  
                  {nextStatus && (
                    <button 
                      className={`k-action-btn ${nextActionClass}`}
                      onClick={() => updateOrderStatus(orderId, nextStatus)}
                    >
                      {nextActionText}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const handleLogout = () => {
    clearStaffAuth('kitchen');
    navigate('/kitchen/login');
  };

  return (
    <div className="kitchen-dashboard-container">
      <header className="kitchen-header">
        <div className="kitchen-brand">
          SmartServe <span>Kitchen</span>
          <span style={{ 
            fontSize: '0.75rem', 
            marginLeft: '15px', 
            padding: '4px 10px', 
            borderRadius: '12px',
            background: isLive ? 'rgba(46, 213, 115, 0.2)' : 'rgba(255, 71, 87, 0.2)',
            color: isLive ? '#2ed573' : '#ff4757',
            border: `1px solid ${isLive ? '#2ed573' : '#ff4757'}`
          }}>
            {isLive ? 'Live Mode' : 'Mock Mode'}
          </span>
        </div>
        <button className="k-logout-btn" onClick={handleLogout}>Staff Exit</button>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#fff', padding: '50px' }}>Loading Kitchen Display System...</div>
      ) : (
        <div className="kitchen-board">
          <Column 
            title="PENDING" 
            statusFilter="pending" 
            nextActionText="Start Preparing" 
            nextStatus="Preparing" 
            nextActionClass="btn-start"
          />
          <Column 
            title="PREPARING" 
            statusFilter="preparing" 
            nextActionText="Mark as Ready" 
            nextStatus="Ready" 
            nextActionClass="btn-ready"
          />
          <Column 
            title="READY" 
            statusFilter="ready" 
            nextActionText="Serve to Table" 
            nextStatus="Served" 
            nextActionClass="btn-serve"
          />
          <Column 
            title="SERVED" 
            statusFilter="served" 
            nextActionText={null} 
            nextStatus={null} 
            nextActionClass=""
          />
        </div>
      )}
    </div>
  );
};

export default KitchenDashboard;
