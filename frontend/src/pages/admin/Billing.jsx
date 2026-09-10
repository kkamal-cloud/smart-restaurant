import React, { useState, useEffect } from 'react';
import api from '../../api';
import './AdminStyles.css';

const Billing = () => {
  const [bills, setBills] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionSearch, setSessionSearch] = useState('');
  const [billSearch, setBillSearch] = useState('');
  
  // Modals state
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [billParams, setBillParams] = useState({ taxRate: 5, discount: 0 });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [paymentParams, setPaymentParams] = useState({ method: 'cash', reference: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [billsRes, sessionsRes] = await Promise.all([
        api.get('/bills'),
        api.get('/sessions?status=active')
      ]);

      if (billsRes.data.success) {
        setBills(billsRes.data.data);
      }
      if (sessionsRes.data.success) {
        setActiveSessions(sessionsRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching billing data:', err);
      setError('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePrint = (billId) => {
    alert(`Printing invoice #${billId.slice(-6).toUpperCase()}...`);
  };

  // Step 1: Open Bill Generation Modal
  const openGenerateBillModal = (session) => {
    setSelectedSession(session);
    setBillParams({ taxRate: 5, discount: 0 });
    setShowBillModal(true);
  };

  // Step 2: Handle Bill Generation API request
  const handleGenerateBillSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSession) return;

    try {
      const response = await api.post('/bills', {
        sessionId: selectedSession._id,
        taxRate: Number(billParams.taxRate),
        discount: Number(billParams.discount)
      });

      if (response.data.success) {
        alert('Bill generated successfully!');
        setShowBillModal(false);
        fetchData();
      }
    } catch (err) {
      console.error('Error generating bill:', err);
      alert(err.response?.data?.error?.message || 'Failed to generate bill');
    }
  };

  // Step 3: Open Payment Processing Modal
  const openPaymentModal = (bill) => {
    setSelectedBill(bill);
    setPaymentParams({ method: 'cash', reference: '' });
    setShowPaymentModal(true);
  };

  // Step 4: Handle Payment API request
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBill) return;

    try {
      const response = await api.post('/payments', {
        billId: selectedBill._id,
        amount: selectedBill.grandTotal,
        method: paymentParams.method,
        reference: paymentParams.reference
      });

      if (response.data.success) {
        alert('Payment processed successfully! Session closed and table released.');
        setShowPaymentModal(false);
        fetchData();
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      alert(err.response?.data?.error?.message || 'Failed to process payment');
    }
  };

  const filteredActiveSessions = activeSessions.filter(session => {
    if (!sessionSearch.trim()) return true;
    const term = sessionSearch.toLowerCase().trim();
    
    const tableNum = String(session.table?.tableNumber || '1').toLowerCase();
    const tableName1 = `table ${tableNum}`;
    const tableName2 = `t${tableNum}`;
    
    const diners = (session.customerIds?.map(c => c.name).join(' ') || 'Anonymous Diner').toLowerCase();
    
    const token = (session.joinToken || '').toLowerCase();
    
    return tableNum.includes(term) || 
           tableName1.includes(term) || 
           tableName2.includes(term) || 
           diners.includes(term) || 
           token.includes(term);
  });

  const filteredBills = bills.filter(bill => {
    if (!billSearch.trim()) return true;
    const term = billSearch.toLowerCase().trim();
    
    const billId = (bill._id || '').slice(-6).toLowerCase();
    
    const tableNum = String(bill.session?.table?.tableNumber || '1').toLowerCase();
    const tableName1 = `table ${tableNum}`;
    const tableName2 = `t${tableNum}`;
    
    const amount = String((bill.grandTotal || 0).toFixed(0));
    const status = bill.isPaid ? 'paid' : 'unpaid';
    const method = (bill.method || '').toLowerCase();
    
    return billId.includes(term) ||
           tableNum.includes(term) ||
           tableName1.includes(term) ||
           tableName2.includes(term) ||
           amount.includes(term) ||
           status.includes(term) ||
           method.includes(term);
  });

  if (loading && activeSessions.length === 0 && bills.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Loading billing records...</h2>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-header">
        <h1>Billing & Payments</h1>
        <button className="btn-add" onClick={fetchData}>🔄 Refresh Data</button>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#ffeaa7', color: '#d63031', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* SECTION 1: Active Dining Sessions */}
      <div className="admin-card" style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ flex: '1 1 300px' }}>
            <h2 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Active Dining Sessions</h2>
            <p style={{ color: '#636e72', fontSize: '0.9rem', marginBottom: 0 }}>
              These tables are currently occupied. You can generate a bill once they finish ordering.
            </p>
          </div>
          
          <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '400px' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#636e72', fontSize: '1.2rem', pointerEvents: 'none' }}>search</span>
            <input 
              type="text" 
              placeholder="Search table, diner or token..." 
              value={sessionSearch}
              onChange={(e) => setSessionSearch(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '35px', paddingRight: '35px', width: '100%', boxSizing: 'border-box', margin: 0 }}
            />
            {sessionSearch && (
              <button 
                onClick={() => setSessionSearch('')}
                style={{ position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#636e72', padding: '0 5px', display: 'flex', alignItems: 'center' }}
                title="Clear search"
              >
                &times;
              </button>
            )}
          </div>
        </div>
        
        <div style={{ marginTop: '1.5rem' }}>
          {activeSessions.length === 0 ? (
            <p style={{ color: '#57606f', textAlign: 'center', padding: '1.5rem' }}>No active customer sessions right now.</p>
          ) : filteredActiveSessions.length === 0 ? (
            <p style={{ color: '#57606f', textAlign: 'center', padding: '1.5rem' }}>No active dining sessions found.</p>
          ) : (
            <table className="admin-table">
            <thead>
              <tr>
                <th>Table</th>
                <th>Diners</th>
                <th>Join Token</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredActiveSessions.map(session => (
                <tr key={session._id}>
                  <td><strong>Table {session.table?.tableNumber || '1'}</strong> ({session.table?.location})</td>
                  <td>{session.customerIds?.map(c => c.name).join(', ') || 'Anonymous Diner'}</td>
                  <td><code>{session.joinToken}</code></td>
                  <td>
                    <span className="badge badge-info">Active Dining</span>
                  </td>
                  <td>
                    <button 
                      className="btn-add" 
                      onClick={() => openGenerateBillModal(session)}
                      style={{ backgroundColor: '#1e90ff' }}
                    >
                      🧾 Generate Bill
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {/* SECTION 2: Generated Bills */}
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px', marginBottom: '1.5rem' }}>
          <div style={{ flex: '1 1 300px' }}>
            <h2 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Billing & Invoices</h2>
            <p style={{ color: '#636e72', fontSize: '0.9rem', marginBottom: 0 }}>
              All generated bills and payment records.
            </p>
          </div>

          <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '400px' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#636e72', fontSize: '1.2rem', pointerEvents: 'none' }}>search</span>
            <input 
              type="text" 
              placeholder="Search bill ID, table, amount or status..." 
              value={billSearch}
              onChange={(e) => setBillSearch(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '35px', paddingRight: '35px', width: '100%', boxSizing: 'border-box', margin: 0 }}
            />
            {billSearch && (
              <button 
                onClick={() => setBillSearch('')}
                style={{ position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#636e72', padding: '0 5px', display: 'flex', alignItems: 'center' }}
                title="Clear search"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {bills.length === 0 ? (
          <p style={{ color: '#57606f', textAlign: 'center', padding: '2rem' }}>No bills found.</p>
        ) : filteredBills.length === 0 ? (
          <p style={{ color: '#57606f', textAlign: 'center', padding: '2rem' }}>No matching bills found.</p>
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
              {filteredBills.map(bill => (
                <tr key={bill._id}>
                  <td>#{bill._id.slice(-6).toUpperCase()}</td>
                  <td>Table {bill.session?.table?.tableNumber || '1'}</td>
                  <td><strong>₹{(bill.grandTotal || 0).toFixed(0)}</strong></td>
                  <td>
                    <span className={`badge ${bill.isPaid ? 'badge-success' : 'badge-warning'}`}>
                      {bill.isPaid ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                  <td>{bill.method ? bill.method.toUpperCase() : '-'}</td>
                  <td>
                    {!bill.isPaid ? (
                      <button 
                        className="btn-add" 
                        onClick={() => openPaymentModal(bill)}
                        style={{ backgroundColor: '#2ed573', marginRight: '8px' }}
                      >
                        💵 Receive Payment
                      </button>
                    ) : (
                      <button className="btn-edit" onClick={() => handlePrint(bill._id)}>Print</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL 1: Generate Bill */}
      {showBillModal && selectedSession && (
        <div className="modal-overlay" style={modalOverlayStyle}>
          <div className="modal-content" style={modalContentStyle}>
            <h2>Generate Bill for Table {selectedSession.table?.tableNumber || '1'}</h2>
            <p style={{ fontSize: '0.9rem', color: '#636e72', marginBottom: '1.5rem' }}>
              Diners: {selectedSession.customerIds?.map(c => c.name).join(', ')}
            </p>
            <form onSubmit={handleGenerateBillSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 'bold' }}>Tax Rate (%)</label>
                <input 
                  type="number" 
                  min="0"
                  required 
                  value={billParams.taxRate} 
                  onChange={(e) => setBillParams({...billParams, taxRate: e.target.value})} 
                  style={inputStyle} 
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 'bold' }}>Discount (₹)</label>
                <input 
                  type="number" 
                  min="0"
                  required 
                  value={billParams.discount} 
                  onChange={(e) => setBillParams({...billParams, discount: e.target.value})} 
                  style={inputStyle} 
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-delete" onClick={() => setShowBillModal(false)}>Cancel</button>
                <button type="submit" className="btn-add" style={{ backgroundColor: '#1e90ff' }}>Generate</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Process Payment */}
      {showPaymentModal && selectedBill && (
        <div className="modal-overlay" style={modalOverlayStyle}>
          <div className="modal-content" style={modalContentStyle}>
            <h2>Receive Payment</h2>
            <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
              Amount Due: <strong>₹{(selectedBill.grandTotal || 0).toFixed(0)}</strong>
            </p>
            <form onSubmit={handlePaymentSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 'bold' }}>Payment Method</label>
                <select 
                  value={paymentParams.method} 
                  onChange={(e) => setPaymentParams({...paymentParams, method: e.target.value})} 
                  style={inputStyle}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI / Online</option>
                </select>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 'bold' }}>Reference / Notes (Optional)</label>
                <input 
                  type="text" 
                  value={paymentParams.reference} 
                  onChange={(e) => setPaymentParams({...paymentParams, reference: e.target.value})} 
                  placeholder="e.g. Transaction ID, cash detail" 
                  style={inputStyle} 
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-delete" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button type="submit" className="btn-add" style={{ backgroundColor: '#2ed573' }}>Complete Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Inline modal styles
const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
  justifyContent: 'center', alignItems: 'center', zIndex: 1000
};
const modalContentStyle = {
  backgroundColor: 'white', padding: '30px', borderRadius: '8px',
  width: '90%', maxWidth: '400px'
};
const inputStyle = {
  width: '100%', padding: '10px', marginTop: '5px',
  border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box'
};

export default Billing;
