import React, { useState, useEffect } from 'react';
import api from '../../api';
import './AdminStyles.css';

const CategoryManagement = () => {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedCatId, setSelectedCatId] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories');
      if (response.data.success) {
        // Sort items by sortOrder
        const sorted = response.data.data.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        setCats(sorted);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setModalMode('add');
    setSelectedCatId(null);
    setName('');
    setDescription('');
    setSortOrder('0');
    setIsActive(true);
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setModalMode('edit');
    setSelectedCatId(cat._id);
    setName(cat.name);
    setDescription(cat.description || '');
    setSortOrder(cat.sortOrder !== undefined ? cat.sortOrder.toString() : '0');
    setIsActive(cat.isActive !== false);
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category Name is required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        sortOrder: Number(sortOrder) || 0,
        isActive
      };

      if (modalMode === 'add') {
        const response = await api.post('/categories', payload);
        if (response.data.success) {
          setIsModalOpen(false);
          fetchCategories();
        } else {
          setError(response.data.message || 'Failed to create category');
        }
      } else {
        const response = await api.put(`/categories/${selectedCatId}`, payload);
        if (response.data.success) {
          setIsModalOpen(false);
          fetchCategories();
        } else {
          setError(response.data.message || 'Failed to update category');
        }
      }
    } catch (err) {
      console.error('Error saving category:', err);
      setError(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

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
        <button className="btn-add" onClick={openAddModal}>+ Add Category</button>
      </div>

      <div className="admin-card">
        {cats.length === 0 ? (
          <p style={{ color: '#57606f', textAlign: 'center', padding: '2rem' }}>No categories found.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Sort Order</th>
                <th>Category Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cats.map(cat => (
                <tr key={cat._id}>
                  <td><strong>{cat.sortOrder || 0}</strong></td>
                  <td style={{ fontWeight: '600', color: '#2f3542' }}>{cat.name}</td>
                  <td>{cat.description || '-'}</td>
                  <td>
                    <span className={`badge ${cat.isActive !== false ? 'badge-success' : 'badge-secondary'}`}>
                      {cat.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-edit" onClick={() => openEditModal(cat)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal overlay */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>{modalMode === 'add' ? 'Add New Category' : 'Edit Category'}</h2>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            {error && <div style={{ color: '#ff4757', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="cat-name">Category Name*</label>
                <input 
                  type="text" 
                  id="cat-name" 
                  className="form-control" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label htmlFor="cat-desc">Description</label>
                <textarea 
                  id="cat-desc" 
                  className="form-control" 
                  rows="3" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="cat-sort">Sort Order</label>
                <input 
                  type="number" 
                  id="cat-sort" 
                  className="form-control" 
                  value={sortOrder} 
                  onChange={(e) => setSortOrder(e.target.value)} 
                />
              </div>

              <div className="form-group form-row-checkbox">
                <input 
                  type="checkbox" 
                  id="cat-active" 
                  checked={isActive} 
                  onChange={(e) => setIsActive(e.target.checked)} 
                />
                <label htmlFor="cat-active">Active</label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-add" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
