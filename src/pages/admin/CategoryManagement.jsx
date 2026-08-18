import React, { useState, useEffect } from 'react';
import api from '../../api';
import './AdminStyles.css';

const CategoryManagement = () => {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        if (response.data.success) {
          setCats(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Loading categories...</h2>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-header">
        <h1>Category Management</h1>
        <button className="btn-add">+ Add Category</button>
      </div>

      <div className="admin-card">
        {cats.length === 0 ? (
          <p style={{ color: '#57606f', textAlign: 'center', padding: '2rem' }}>No categories found.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Category Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cats.map(cat => (
                <tr key={cat._id || Math.random().toString()}>
                  <td>{cat._id ? cat._id.slice(-6).toUpperCase() : 'N/A'}</td>
                  <td>{cat.name}</td>
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

export default CategoryManagement;
