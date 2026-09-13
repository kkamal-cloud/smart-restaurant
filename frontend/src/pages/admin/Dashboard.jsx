import React, { useState, useEffect } from 'react';
import api from '../../api';
import { formatOrderNumber } from '../../utils/numberFormatters';
import './AdminStyles.css';

const Dashboard = () => {
  const [stats, setStats] = useState([
    { title: "Today's Orders", value: 0, color: "#1e90ff" },
    { title: "Pending Orders", value: 0, color: "#ffa502" },
    { title: "Today's Revenue", value: "₹ 0", color: "#2ed573" },
    { title: "Available Tables", value: 0, color: "#ff4757" }
  ]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          api.get('/reports/dashboard-stats'),
          api.get('/kitchen/orders')
        ]);

        if (statsRes.data.success) {
          const s = statsRes.data.data;
          setStats([
            { title: "Today's Orders", value: s.todayOrders, color: "#1e90ff" },
            { title: "Pending Orders", value: s.pendingOrders, color: "#ffa502" },
            { title: "Today's Revenue", value: `₹ ${s.todayRevenue.toLocaleString()}`, color: "#2ed573" },
            { title: "Available Tables", value: s.availableTables, color: "#ff4757" }
          ]);
        }

        if (ordersRes.data.success) {
          // Take last 5 orders
          const orders = ordersRes.data.data.slice(-5).reverse();
          setRecentOrders(orders.map(order => ({
            id: order._id,
            orderNumber: order.orderNumber,
            table: order.session?.table?.tableNumber || '1',
            amount: order.total || 0,
            status: order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'
          })));
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Loading Dashboard Overview...</h2>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-header">
        <h1>Dashboard Overview</h1>
        <p>{new Date().toDateString()}</p>
      </div>

      <div className="admin-grid-4">
        {stats.map((stat, i) => (
          <div key={i} className="admin-card" style={{borderTop: `4px solid ${stat.color}`}}>
            <h3 style={{color: '#57606f', margin: '0 0 10px 0'}}>{stat.title}</h3>
            <div style={{fontSize: '2rem', fontWeight: 'bold', color: '#2f3542'}}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="admin-card" style={{marginTop: '2rem'}}>
        <h2>Recent Orders Activity</h2>
        {recentOrders.length === 0 ? (
          <p style={{ color: '#57606f', marginTop: '10px' }}>No recent orders.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Table</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => (
                <tr key={order.id}>
                  <td>{formatOrderNumber(order.orderNumber, order.id)}</td>

                  <td>Table {order.table}</td>
                  <td>₹{order.amount.toFixed(2)}</td>
                  <td>
                    <span className={`badge ${order.status === 'Pending' ? 'badge-warning' : order.status === 'Preparing' ? 'badge-info' : 'badge-success'}`}>
                      {order.status}
                    </span>
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

export default Dashboard;
