import React, { useState, useEffect } from 'react';
import api, { getImageUrl } from '../../api';
import './AdminStyles.css';

const MenuManagement = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedItemId, setSelectedItemId] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [category, setCategory] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isVeg, setIsVeg] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [foodsRes, catsRes] = await Promise.all([
        api.get('/foods'),
        api.get('/categories')
      ]);

      if (foodsRes.data.success) {
        const normalized = foodsRes.data.data.map(f => ({
          ...f,
          id: f._id,
          categoryName: f.category?.name || 'Uncategorized',
          categoryId: f.category?._id || f.category,
          available: f.isAvailable !== false,
          isVeg: f.isVeg !== false
        }));
        setMenuItems(normalized);
      }

      if (catsRes.data.success) {
        setCategories(catsRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch menu items or categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setModalMode('add');
    setSelectedItemId(null);
    setName('');
    setDescription('');
    setPrice('');
    setCostPrice('');
    setCategory(categories[0]?._id || '');
    setIsAvailable(true);
    setIsVeg(true);
    setImageFile(null);
    setPreviewUrl('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setModalMode('edit');
    setSelectedItemId(item.id);
    setName(item.name);
    setDescription(item.description || '');
    setPrice(item.price);
    setCostPrice(item.costPrice || '');
    setCategory(item.categoryId || '');
    setIsAvailable(item.available);
    setIsVeg(item.isVeg !== false);
    setImageFile(null);
    setPreviewUrl(getImageUrl(item.image));
    setError('');
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price || !category) {
      setError('Please fill in Name, Price, and Category.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const foodData = {
        name,
        description,
        price: Number(price),
        costPrice: costPrice ? Number(costPrice) : 0,
        category,
        isAvailable,
        isVeg
      };

      let savedFoodId = null;

      if (modalMode === 'add') {
        const response = await api.post('/foods', foodData);
        if (response.data.success) {
          savedFoodId = response.data.data._id;
        } else {
          throw new Error(response.data.message || 'Failed to create food item');
        }
      } else {
        const response = await api.put(`/foods/${selectedItemId}`, foodData);
        if (response.data.success) {
          savedFoodId = selectedItemId;
        } else {
          throw new Error(response.data.message || 'Failed to update food item');
        }
      }

      // If an image was selected, upload it
      if (imageFile && savedFoodId) {
        const formData = new FormData();
        formData.append('image', imageFile);
        await api.post(`/foods/${savedFoodId}/image`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving food item:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save food item.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;

    try {
      const response = await api.delete(`/foods/${id}`);
      if (response.data.success) {
        fetchData();
      } else {
        alert(response.data.message || 'Failed to delete food item');
      }
    } catch (err) {
      console.error('Error deleting food item:', err);
      alert(err.response?.data?.message || 'Failed to delete food item.');
    }
  };

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
        <button className="btn-add" onClick={openAddModal}>+ Add New Food</button>
      </div>

      {error && <div style={{ color: '#ff4757', marginBottom: '1rem', fontWeight: 'bold' }}>{error}</div>}

      <div className="admin-card">
        {menuItems.length === 0 ? (
          <p style={{ color: '#57606f', textAlign: 'center', padding: '2rem' }}>No menu items found.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Diet Type</th>
                <th>Category</th>
                <th>Price</th>
                <th>Cost Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {menuItems.map(item => (
                <tr key={item.id}>
                  <td>
                    <img 
                      src={getImageUrl(item.image)} 
                      alt={item.name} 
                      style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #dfe6e9'}} 
                      onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = 'https://placehold.co/50x50?text=Food';
                      }} 
                    />
                  </td>
                  <td style={{ fontWeight: '600', color: '#2f3542' }}>{item.name}</td>
                  <td>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      border: item.isVeg ? '1.5px solid #1A5C3A' : '1.5px solid #C94B2C',
                      color: item.isVeg ? '#1A5C3A' : '#C94B2C',
                      backgroundColor: item.isVeg ? 'rgba(26,92,58,0.08)' : 'rgba(201,75,44,0.08)'
                    }}>
                      {item.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
                    </span>
                  </td>
                  <td>{item.categoryName}</td>
                  <td><span className="table-price">₹{item.price}</span></td>
                  <td><span className="table-price" style={{color: '#8B6340'}}>₹{item.costPrice || 0}</span></td>
                  <td>
                    <span className={`badge ${item.available ? 'badge-success' : 'badge-secondary'}`}>
                      {item.available ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-edit" onClick={() => openEditModal(item)}>Edit</button>
                    <button className="btn-delete" onClick={() => handleDelete(item.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>{modalMode === 'add' ? 'Add New Food Item' : 'Edit Food Item'}</h2>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            
            {error && <div style={{ color: '#ff4757', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="food-name">Food Name*</label>
                <input 
                  type="text" 
                  id="food-name" 
                  className="form-control" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Price (₹)*</label>
                <input 
                  type="number" 
                  className="form-control"
                  value={price} 
                  onChange={(e) => setPrice(e.target.value)} 
                  placeholder="Selling Price"
                  min="0"
                  required 
                />
              </div>

              <div className="form-group">
                <label>Cost Price (₹)</label>
                <input 
                  type="number" 
                  className="form-control"
                  value={costPrice} 
                  onChange={(e) => setCostPrice(e.target.value)} 
                  placeholder="Production Cost"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="food-cat">Category*</label>
                <select 
                  id="food-cat" 
                  className="form-control" 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)} 
                  required
                >
                  <option value="" disabled>Select Category</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{gridColumn: '1 / -1'}}>
                <label htmlFor="food-desc">Description</label>
                <textarea 
                  id="food-desc" 
                  className="form-control" 
                  rows="3" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label htmlFor="food-price">Price (₹)*</label>
                  <input 
                    type="number" 
                    id="food-price" 
                    className="form-control" 
                    min="0" 
                    value={price} 
                    onChange={(e) => setPrice(e.target.value)} 
                    required 
                  />
                </div>
                <div>
                  <label htmlFor="food-cat">Category*</label>
                  <select 
                    id="food-cat" 
                    className="form-control" 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)} 
                    required
                  >
                    <option value="" disabled>Select Category</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Food Type (Diet)*</label>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '600', color: '#1A5C3A' }}>
                    <input 
                      type="radio" 
                      name="dietType" 
                      checked={isVeg === true} 
                      onChange={() => setIsVeg(true)} 
                    />
                    🟢 Pure Veg
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '600', color: '#C94B2C' }}>
                    <input 
                      type="radio" 
                      name="dietType" 
                      checked={isVeg === false} 
                      onChange={() => setIsVeg(false)} 
                    />
                    🔴 Non-Veg
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="food-image">Food Image File</label>
                <input 
                  type="file" 
                  id="food-image" 
                  className="form-control" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                />
                {previewUrl && (
                  <div style={{ marginTop: '10px', textAlign: 'center' }}>
                    <p style={{ margin: '0 0 5px', fontSize: '0.85rem', color: '#57606f' }}>Preview:</p>
                    <img 
                      src={previewUrl} 
                      alt="Food preview" 
                      style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #dfe6e9' }} 
                    />
                  </div>
                )}
              </div>

              <div className="form-group form-row-checkbox">
                <input 
                  type="checkbox" 
                  id="food-avail" 
                  checked={isAvailable} 
                  onChange={(e) => setIsAvailable(e.target.checked)} 
                />
                <label htmlFor="food-avail">Available for Order</label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-add" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
