import React, { useState, useEffect } from 'react';
import api from '../../api';
import './AdminStyles.css';

const MenuManagement = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const response = await api.get('/foods');
        if (response.data.success) {
          const normalized = response.data.data.map(f => ({
            ...f,
            id: f._id,
            category: f.category?.name || f.category,
            available: f.isAvailable !== false
          }));
          setMenuItems(normalized);
        }
      } catch (err) {
        console.error('Error fetching foods:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFoods();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Loading Menu Items...</h2>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-header">
        <h1>Menu Management</h1>
        <button className="btn-add">+ Add New Food</button>
      </div>

      <div className="admin-card">
        {menuItems.length === 0 ? (
          <p style={{ color: '#57606f', textAlign: 'center', padding: '2rem' }}>No menu items found.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {menuItems.map(item => (
                <tr key={item.id}>
                  <td>
                    <img src={item.image} alt={item.name} style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px'}} onError={(e) => e.target.style.display = 'none'} />
                  </td>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>₹{item.price}</td>
                  <td>
                    <span className={`badge ${item.available ? 'badge-success' : 'badge-secondary'}`}>
                      {item.available ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-edit">Edit</button>
                    <button className="btn-delete">Delete</button>
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

export default MenuManagement;
