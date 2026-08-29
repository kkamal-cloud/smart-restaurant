import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../api';
import './AdminStyles.css';

const TableManagement = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  
  // For adding a new table
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTable, setNewTable] = useState({ tableNumber: '', capacity: 2, location: '' });

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      // In a real app, you would pass the admin auth token
      // We assume it's handled by interceptors in api.js if available
      const response = await api.get('/tables');
      if (response.data.success) {
        setTables(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/tables', newTable);
      if (response.data.success) {
        setTables([...tables, response.data.data]);
        setShowAddModal(false);
        setNewTable({ tableNumber: '', capacity: 2, location: '' });
      }
    } catch (error) {
      console.error('Error adding table:', error);
      alert('Failed to add table');
    }
  };

  const handleGenerateQR = async (tableId) => {
    try {
      const response = await api.post(`/qr/generate/${tableId}`);
      if (response.data.success) {
        alert('New QR Code generated successfully!');
        fetchTables(); // Refresh to get new token
      }
    } catch (error) {
      console.error('Error generating QR:', error);
    }
  };

  const viewQR = (table) => {
    setSelectedTable(table);
    setShowQrModal(true);
  };

  return (
    <div>
      <div className="admin-header">
        <h1>Table Management</h1>
        <button className="btn-add" onClick={() => setShowAddModal(true)}>+ Add Table</button>
      </div>

      {loading ? (
        <p>Loading tables...</p>
      ) : (
        <div className="admin-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Table Number</th>
                <th>Capacity</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tables.map(table => (
                <tr key={table._id}>
                  <td>Table {table.tableNumber}</td>
                  <td>{table.capacity}</td>
                  <td>{table.location}</td>
                  <td>
                    <span className={`badge ${table.isAvailable ? 'badge-success' : 'badge-warning'}`}>
                      {table.isAvailable ? 'Available' : 'Occupied'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-edit" onClick={() => viewQR(table)}>View QR</button>
                    <button className="btn-edit" onClick={() => handleGenerateQR(table._id)} style={{ marginLeft: '8px' }}>Regenerate QR</button>
                  </td>
                </tr>
              ))}
              {tables.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>No tables found. Add a table to begin.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="modal-overlay" style={modalOverlayStyle}>
          <div className="modal-content" style={modalContentStyle}>
            <h2>Add New Table</h2>
            <form onSubmit={handleAddTable}>
              <div style={{ marginBottom: '1rem' }}>
                <label>Table Number</label>
                <input type="text" required value={newTable.tableNumber} onChange={(e) => setNewTable({...newTable, tableNumber: e.target.value})} style={inputStyle} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label>Capacity</label>
                <input type="number" min="1" required value={newTable.capacity} onChange={(e) => setNewTable({...newTable, capacity: e.target.value})} style={inputStyle} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label>Location</label>
                <input type="text" required value={newTable.location} onChange={(e) => setNewTable({...newTable, location: e.target.value})} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-delete" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-add">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View QR Modal */}
      {showQrModal && selectedTable && (
        <div className="modal-overlay" style={modalOverlayStyle}>
          <div className="modal-content" style={{...modalContentStyle, textAlign: 'center'}}>
            <h2>QR Code for Table {selectedTable.tableNumber}</h2>
            <p>Location: {selectedTable.location} | Capacity: {selectedTable.capacity}</p>
            <div style={{ margin: '20px 0' }}>
              <QRCodeSVG 
                value={`${import.meta.env.VITE_APP_URL || 'http://localhost:5173'}/scan/${selectedTable.qrToken}`} 
                size={256} 
                level={"H"}
                includeMargin={true}
              />
            </div>
            <p style={{ fontSize: '0.8rem', color: '#666' }}>URL: {import.meta.env.VITE_APP_URL || 'http://localhost:5173'}/scan/{selectedTable.qrToken}</p>
            <button className="btn-edit" onClick={() => setShowQrModal(false)} style={{ marginTop: '15px' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

// Basic inline styles for modals (you can move these to CSS later)
const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
  justifyContent: 'center', alignItems: 'center', zIndex: 1000
};
const modalContentStyle = {
  backgroundColor: 'white', padding: '30px', borderRadius: '8px',
  width: '100%', maxWidth: '400px'
};
const inputStyle = {
  width: '100%', padding: '8px', marginTop: '5px',
  border: '1px solid #ccc', borderRadius: '4px'
};

export default TableManagement;
