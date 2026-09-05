import React, { useState, useEffect } from 'react';
import api from '../../api';
import './AdminStyles.css';

const StockManagement = () => {
  const [stockList, setStockList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStock = async () => {
    try {
      const response = await api.get('/stock');
      if (response.data.success) {
        setStockList(response.data.data);
      } else {
        setError('Failed to fetch stock data');
      }
    } catch (err) {
      console.error('Error fetching stock:', err);
      setError('Failed to fetch stock data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const handleRestock = async (foodId) => {
    const amountStr = prompt('Enter quantity to add to stock:', '50');
    if (!amountStr) return;
    const amount = parseInt(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive number.');
      return;
    }

    try {
      const response = await api.post('/stock/restock', { foodId, quantity: amount });
      if (response.data.success) {
        fetchStock();
      }
    } catch (err) {
      console.error('Error restocking:', err);
      alert('Failed to update stock. Admin authentication required.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Loading stock levels...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: '#ff4757' }}>{error}</h2>
        <button onClick={fetchStock} className="btn-add" style={{ marginTop: '1rem' }}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-header">
        <h1>Stock Management</h1>
      </div>

      <div className="admin-card">
        {stockList.length === 0 ? (
          <p style={{ color: '#57606f', textAlign: 'center', padding: '2rem' }}>No stock records found.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stockList.map((item) => {
                const food = item.food || {};
                const stock = item.quantity;
                const status = stock === 0 ? 'Out of Stock' : item.isLow ? 'Low Stock' : 'In Stock';
                const badgeClass = stock === 0 ? 'badge-secondary' : item.isLow ? 'badge-warning' : 'badge-success';

                return (
                  <tr key={item._id}>
                    <td>{food.name || 'Unknown'}</td>
                    <td>{food.category?.name || 'Main Course'}</td>
                    <td>{stock} units</td>
                    <td>
                      <span className={`badge ${badgeClass}`}>{status}</span>
                    </td>
                    <td>
                      <button className="btn-edit" onClick={() => handleRestock(food._id)}>Update Stock</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StockManagement;
