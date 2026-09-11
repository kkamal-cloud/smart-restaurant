import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import api from '../../api';
import './AdminStyles.css';

const TableManagement = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  // View QR Modal state
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);

  // Add Table Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTable, setNewTable] = useState({ tableNumber: '', capacity: 2, location: '' });

  // Regenerate Confirmation Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [tableToRegenerate, setTableToRegenerate] = useState(null);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await api.get('/tables');
      if (response.data?.success) {
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
      if (response.data?.success) {
        setTables([...tables, response.data.data]);
        setShowAddModal(false);
        setNewTable({ tableNumber: '', capacity: 2, location: '' });
      }
    } catch (error) {
      console.error('Error adding table:', error);
      alert('Failed to add table');
    }
  };

  const openRegenerateConfirm = (table) => {
    setTableToRegenerate(table);
    setShowConfirmModal(true);
  };

  const handleConfirmRegenerate = async () => {
    if (!tableToRegenerate) return;
    try {
      const response = await api.post(`/qr/generate/${tableToRegenerate._id}`);
      if (response.data?.success) {
        const updatedToken = response.data.data.qrToken;
        setTables(prevTables =>
          prevTables.map(t => (t._id === tableToRegenerate._id ? { ...t, qrToken: updatedToken } : t))
        );
        if (selectedTable && selectedTable._id === tableToRegenerate._id) {
          setSelectedTable(prev => ({ ...prev, qrToken: updatedToken }));
        }
        alert(`New QR Code generated for Table ${tableToRegenerate.tableNumber}!`);
      }
    } catch (error) {
      console.error('Error generating QR:', error);
      alert('Failed to regenerate QR code');
    } finally {
      setShowConfirmModal(false);
      setTableToRegenerate(null);
    }
  };

  const viewQR = (table) => {
    setSelectedTable(table);
    setShowQrModal(true);
  };

  // Download high-res printable QR card as PNG (Table-T1-QR.png)
  const handleDownloadQR = () => {
    if (!selectedTable) return;
    const qrCanvasElement = document.getElementById('table-qr-canvas');
    if (!qrCanvasElement) {
      alert('QR Canvas not ready. Please try again.');
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 1050;

    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative Red & Gold border
    ctx.strokeStyle = '#91280eff';
    ctx.lineWidth = 14;
    ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

    ctx.strokeStyle = '#C8860A';
    ctx.lineWidth = 4;
    ctx.strokeRect(48, 48, canvas.width - 96, canvas.height - 96);

    // Brand Name
    ctx.fillStyle = '#C94B2C';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SMARTSERVE', canvas.width / 2, 130);

    // Table Label
    ctx.fillStyle = '#2C1A0E';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(`TABLE ${selectedTable.tableNumber.toUpperCase()}`, canvas.width / 2, 200);

    // Draw QR Code centered (500x500)
    const qrSize = 500;
    const qrX = (canvas.width - qrSize) / 2;
    const qrY = 240;
    ctx.drawImage(qrCanvasElement, qrX, qrY, qrSize, qrSize);

    // Footer Text
    ctx.fillStyle = '#5C3D1E';
    ctx.font = '600 32px sans-serif';
    ctx.fillText('Scan to View Menu', canvas.width / 2, 820);

    // Location & Capacity
    ctx.fillStyle = '#8B6340';
    ctx.font = '24px sans-serif';
    ctx.fillText(`Location: ${selectedTable.location} | Capacity: ${selectedTable.capacity}`, canvas.width / 2, 880);

    // Trigger download with dynamic table number in filename
    const link = document.createElement('a');
    link.download = `Table-${selectedTable.tableNumber}-QR.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Print QR Card
  const handlePrintQR = () => {
    window.print();
  };

  const getQrUrl = (token) => {
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    return `${baseUrl}/scan/${token}`;
  };

  return (
    <div className="table-management-page">
      <div className="admin-header">
        <div>
          <h1>Table Management</h1>
          <p>Manage restaurant dining tables, download, and print table QR codes.</p>
        </div>
        <button className="btn-add" onClick={() => setShowAddModal(true)}>+ Add Table</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading tables...</div>
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
                  <td><strong>Table {table.tableNumber}</strong></td>
                  <td>{table.capacity} Persons</td>
                  <td>{table.location}</td>
                  <td>
                    <span className={`badge ${table.isAvailable ? 'badge-success' : 'badge-warning'}`}>
                      {table.isAvailable ? 'Available' : 'Occupied'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-edit" onClick={() => viewQR(table)}>View QR</button>
                    <button className="btn-secondary" onClick={() => openRegenerateConfirm(table)} style={{ marginLeft: '6px' }}>
                      🔄 Regenerate QR
                    </button>
                  </td>
                </tr>
              ))}
              {tables.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>No tables found. Add a table to begin.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <h2>Add New Table</h2>
            <form onSubmit={handleAddTable} style={{ marginTop: '15px' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Table Number</label>
                <input 
                  type="text" 
                  required 
                  value={newTable.tableNumber} 
                  onChange={(e) => setNewTable({...newTable, tableNumber: e.target.value})} 
                  placeholder="e.g. T1 or 12"
                  className="form-control"
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Capacity</label>
                <input 
                  type="number" 
                  min="1" 
                  required 
                  value={newTable.capacity} 
                  onChange={(e) => setNewTable({...newTable, capacity: e.target.value})} 
                  className="form-control"
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Location</label>
                <input 
                  type="text" 
                  required 
                  value={newTable.location} 
                  onChange={(e) => setNewTable({...newTable, location: e.target.value})} 
                  placeholder="e.g. Window, Main Hall, Patio"
                  className="form-control"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-add">Save Table</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View QR Modal */}
      {showQrModal && selectedTable && (
        <div className="modal-overlay">
          <div className="modal-content qr-modal-content">
            <div className="qr-modal-header">
              <h2>SMARTSERVE</h2>
              <h3>QR Code for Table {selectedTable.tableNumber}</h3>
              <p className="qr-modal-meta">
                Location: {selectedTable.location} | Capacity: {selectedTable.capacity}
              </p>
            </div>

            {/* Printable QR Card Wrapper */}
            <div id="printable-qr-card" className="printable-qr-card">
              <div className="printable-card-header">SMARTSERVE</div>
              <div className="printable-table-title">TABLE {selectedTable.tableNumber}</div>
              
              <div className="qr-canvas-container">
                <QRCodeCanvas 
                  id="table-qr-canvas"
                  value={getQrUrl(selectedTable.qrToken)} 
                  size={220} 
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="printable-card-footer">Scan to View Menu</div>
            </div>

            {/* Responsive Long URL Display */}
            <div className="qr-url-box">
              <span className="qr-url-label">QR URL:</span>
              <p className="qr-url-text">{getQrUrl(selectedTable.qrToken)}</p>
            </div>

            {/* Action Buttons */}
            <div className="qr-modal-actions">
              <button type="button" className="btn-primary" onClick={handleDownloadQR}>
                📥 Download QR
              </button>
              <button type="button" className="btn-gold" onClick={handlePrintQR}>
                🖨️ Print QR
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowQrModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regenerate Confirmation Modal */}
      {showConfirmModal && tableToRegenerate && (
        <div className="modal-overlay">
          <div className="modal-content confirm-modal-content">
            <h2 style={{ color: '##070200f', margin: '0 0 10px 0' }}>
              Regenerate QR for Table {tableToRegenerate.tableNumber}?
            </h2>
            <div className="confirm-warning-box" style={{ color: '#070200ff', background: '#ff3e3eff' }}>
              ⚠️ <strong>Warning:</strong> The current QR code for Table {tableToRegenerate.tableNumber} will stop working immediately after regeneration. You will need to print and replace the physical QR code on the table.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => { setShowConfirmModal(false); setTableToRegenerate(null); }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-delete" 
                onClick={handleConfirmRegenerate}
              >
                Regenerate QR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableManagement;
