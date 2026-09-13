import React, { useState, useEffect } from 'react';
import api from '../../api';
import socket from '../../socket';
import { formatOrderNumber } from '../../utils/numberFormatters';
import './AdminStyles.css';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    try {
      const response = await api.get('/kitchen/orders?status=all');
      if (response.data.success) {
        setOrders(response.data.data);
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

  useEffect(() => {
    fetchOrders();

    socket.emit('joinAdmin');

    const handleNewOrder = (newOrder) => {
      setOrders(prev => {
        const id = newOrder._id || newOrder.id;
        const exists = prev.some(o => (o._id || o.id) === id);
        if (exists) return prev;
        return [newOrder, ...prev];
      });
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

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const response = await api.patch(`/orders/${orderId}/status`, { status: newStatus.toLowerCase() });
      if (response.data.success) {
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order._id === orderId ? { ...order, status: newStatus.toLowerCase() } : order
          )
        );
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      alert(err.response?.data?.error?.message || 'Failed to update status. Remember, status transitions must be sequential: Pending → Preparing → Ready → Served.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Loading orders list...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: '#ff4757' }}>{error}</h2>
        <button onClick={fetchOrders} className="btn-add" style={{ marginTop: '1rem' }}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-header">
        <h1>Order Management</h1>
      </div>

      <div className="admin-card">
        {orders.length === 0 ? (
          <p style={{ color: '#57606f', textAlign: 'center', padding: '2rem' }}>No orders found.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Table</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id}>
                  <td>{formatOrderNumber(order.orderNumber, order._id)}</td>

                  <td>Table {order.session?.table?.tableNumber || '1'}</td>
                  <td>{order.session?.customerIds?.map(c => c.name).join(', ') || 'Customer'}</td>
                  <td>₹{(order.total || 0).toFixed(2)}</td>
                  <td>
                    <select 
                      value={(order.status || 'pending').toLowerCase()} 
                      onChange={(e) => handleStatusChange(order._id, e.target.value)} 
                      style={{padding: '0.4rem', borderRadius: '4px', border: '1px solid #ced6e0'}}
                    >
                      <option value="pending">Pending</option>
                      <option value="preparing">Preparing</option>
                      <option value="ready">Ready</option>
                      <option value="served">Served</option>
                    </select>
                  </td>
                  <td>
                    <button className="btn-edit" onClick={() => handleStatusChange(order._id, 'served')} disabled={order.status === 'served'}>
                      Serve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default OrderManagement;
