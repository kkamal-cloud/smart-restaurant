import React, { useState, useEffect } from 'react';
import api from '../../api';
import './AdminStyles.css';

const Billing = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBills = async () => {
    try {
      const response = await api.get('/bills');
      if (response.data.success) {
        setBills(response.data.data);
      } else {
        setError('Failed to fetch bills');
      }
    } catch (err) {
      console.error('Error fetching bills:', err);
      setError('Failed to fetch bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handlePrint = (billId) => {
    alert(`Printing invoice #${billId.slice(-6).toUpperCase()}...`);
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Loading billing records...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: '#ff4757' }}>{error}</h2>
        <button onClick={fetchBills} className="btn-add" style={{ marginTop: '1rem' }}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-header">
        <h1>Billing & Payments</h1>
      </div>

      <div className="admin-card">
        {bills.length === 0 ? (
          <p style={{ color: '#57606f', textAlign: 'center', padding: '2rem' }}>No bills found.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Bill ID</th>
                <th>Table</th>
                <th>Amount</th>
                <th>Payment Status</th>
                <th>Method</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.map(bill => (
                <tr key={bill._id}>
                  <td>#{bill._id.slice(-6).toUpperCase()}</td>
                  <td>Table {bill.session?.table?.tableNumber || '1'}</td>
                  <td>₹{(bill.grandTotal || 0).toFixed(2)}</td>
                  <td>
                    <span className={`badge ${bill.isPaid ? 'badge-success' : 'badge-warning'}`}>
                      {bill.isPaid ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                  <td>{bill.paymentMethod || '-'}</td>
                  <td>
                    <button className="btn-edit" onClick={() => handlePrint(bill._id)}>Print</button>
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

export default Billing;
