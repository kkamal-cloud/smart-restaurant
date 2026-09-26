import React, { useState, useEffect } from 'react';
import api from '../../api';
import socket from '../../socket';
import { formatBillNumber } from '../../utils/numberFormatters';
import './AdminStyles.css';

const Billing = () => {
  const [bills, setBills] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [payments, setPayments] = useState([]);
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
  const [razorpayLoading, setRazorpayLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [billsRes, sessionsRes, paymentsRes] = await Promise.all([
        api.get('/bills'),
        api.get('/sessions?status=active'),
        api.get('/payments')
      ]);
      if (billsRes.data.success) setBills(billsRes.data.data);
      if (sessionsRes.data.success) setActiveSessions(sessionsRes.data.data);
      if (paymentsRes.data?.success) setPayments(paymentsRes.data.data);
    } catch (err) {
      console.error('Error fetching billing data:', err);
      setError('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    socket.on('bill:generated', () => fetchData());
    socket.on('payment:pending', () => fetchData());
    socket.on('payment:updated', () => fetchData());
    socket.on('session:closed', () => fetchData());

    return () => {
      socket.off('bill:generated');
      socket.off('payment:pending');
      socket.off('payment:updated');
      socket.off('session:closed');
    };
  }, []);

  const handlePrint = (bill) => {
    if (!bill) {
      window.print();
      return;
    }

    const billNum = formatBillNumber(bill.billNumber, bill._id);
    const tableNum = bill.session?.table?.tableNumber || '1';
    const customerName =
      bill.session?.customerIds?.map(c => c.name).filter(Boolean).join(', ') ||
      bill.customerName ||
      'Customer'; const dateStr = new Date(bill.createdAt || Date.now()).toLocaleDateString();
    const timeStr = new Date(bill.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const items = bill.items || [];
    const subtotal = Number(bill.subtotal || 0).toFixed(2);
    const taxRate = bill.taxRate || 5;
    const taxAmount = Number((bill.subtotal * taxRate) / 100).toFixed(2);
    const discountAmount = bill.discount ? Number(bill.discount).toFixed(2) : 0;
    const grandTotal = Number(bill.grandTotal || 0).toFixed(2);
    const paymentStatus = bill.isPaid ? 'PAID' : 'PENDING';
    const payment = getPaymentForBill(bill._id);
    const paymentMethod =
      bill.method ||
      payment?.method ||
      '-';

    const paymentMethodDisplay = paymentMethod.toUpperCase();

    const printWindow = window.open('', '_blank', 'width=800,height=700');
    if (!printWindow) {
      window.print();
      return;
    }

    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: left;">${item.foodName || item.name || 'Item'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${Number(item.price || 0).toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${Number(item.total || (item.price * item.quantity)).toFixed(2)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice BILL-${billNum}</title>
        <style>
          @page { size: auto; margin: 15mm; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2d3436; margin: 0; padding: 20px; background: #fff; }
          .bill-card { max-width: 600px; margin: 0 auto; background: #fff; border: 1px solid #e0e0e0; border-radius: 12px; padding: 30px; }
          .bill-header { text-align: center; border-bottom: 2px solid #C94B2C; padding-bottom: 16px; margin-bottom: 20px; }
          .bill-header h1 { margin: 0 0 6px 0; color: #C94B2C; font-size: 26px; }
          .bill-header p { margin: 2px 0; color: #636e72; font-size: 13px; }
          .bill-title { font-size: 18px; font-weight: 700; color: #2d3436; margin-top: 10px; letter-spacing: 1px; }
          .bill-info { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px; line-height: 1.6; }
          .bill-info p { margin: 3px 0; }
          .bill-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
          .bill-table th { background: #f8f9fa; border-bottom: 2px solid #ddd; padding: 10px; text-align: left; color: #57606f; }
          .bill-totals { width: 280px; margin-left: auto; margin-bottom: 24px; font-size: 14px; }
          .total-row { display: flex; justify-content: space-between; padding: 5px 0; color: #2d3436; }
          .grand-total { font-size: 18px; font-weight: bold; border-top: 2px solid #2d3436; padding-top: 8px; margin-top: 4px; color: #C94B2C; }
          .bill-footer { text-align: center; border-top: 1px solid #eee; padding-top: 16px; color: #636e72; font-size: 13px; }
          .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
          .badge-paid { background: #2ed573; color: white; }
          .badge-pending { background: #ffa502; color: white; }
        </style>
      </head>
      <body>
        <div class="bill-card">
          <div class="bill-header">
            <h1>SmartServe</h1>
            <p>52C South Street, Sivakasi</p>
            <p>Phone: +91 8300724846</p>
            <div class="bill-title">INVOICE</div>
          </div>
          <div class="bill-info">
            <div>
              <p><strong>Customer:</strong> ${customerName}</p>
              <p><strong>Table No:</strong> Table ${tableNum}</p>
<p><strong>Payment Method:</strong> ${paymentMethodDisplay}</p>
            </div>
            <div style="text-align: right;">
              <p><strong>Bill No:</strong> BILL-${billNum}</p>
              <p><strong>Date:</strong> ${dateStr}</p>
              <p><strong>Time:</strong> ${timeStr}</p>
              <p><strong>Status:</strong> <span class="badge ${bill.isPaid ? 'badge-paid' : 'badge-pending'}">${paymentStatus}</span></p>
            </div>
          </div>
          <table class="bill-table">
            <thead>
              <tr>
                <th style="text-align: left;">Item</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="bill-totals">
            <div class="total-row"><span>Subtotal:</span><span>₹${subtotal}</span></div>
            <div class="total-row"><span>Tax (${taxRate}% GST):</span><span>₹${taxAmount}</span></div>
            ${discountAmount > 0 ? `<div class="total-row"><span>Discount:</span><span>-₹${discountAmount}</span></div>` : ''}
            <div class="total-row grand-total"><span>Grand Total:</span><span>₹${grandTotal}</span></div>
          </div>
          <div class="bill-footer">
            <p>Thank you for dining with us!</p>
            <p>Please visit again.</p>
          </div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const openGenerateBillModal = (session) => {
    setSelectedSession(session);
    setBillParams({ taxRate: 5, discount: 0 });
    setShowBillModal(true);
  };

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

  const openPaymentModal = (bill, defaultMethod = 'cash') => {
    setSelectedBill(bill);
    setPaymentParams({ method: defaultMethod, reference: '' });
    setShowPaymentModal(true);
  };

  const handleManualPayment = async () => {
    if (!selectedBill) return;
    try {
      const response = await api.post('/payments', {
        billId: selectedBill._id,
        amount: selectedBill.grandTotal,
        method: paymentParams.method,
        reference: paymentParams.reference
      });
      if (response.data.success) {
        alert('Payment confirmed successfully! Customer session closed.');
        setShowPaymentModal(false);
        fetchData();
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      alert(err.response?.data?.error?.message || 'Failed to process payment');
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-script')) { resolve(true); return; }
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async () => {
    if (!selectedBill) return;
    setRazorpayLoading(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert('Failed to load Razorpay. Check your internet connection.');
        setRazorpayLoading(false);
        return;
      }
      const orderRes = await api.post('/payments/razorpay/create-order', { billId: selectedBill._id });
      if (!orderRes.data.success) {
        alert('Failed to create Razorpay order.');
        setRazorpayLoading(false);
        return;
      }
      const { orderId, amount, currency, keyId } = orderRes.data.data;
      const options = {
        key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: 'SmartServe Restaurant',
        description: `Bill #${formatBillNumber(selectedBill.billNumber, selectedBill._id)}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyRes = await api.post('/payments/razorpay/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              billId: selectedBill._id,
            });
            if (verifyRes.data.success) {
              alert('Payment verified! Bill paid. Session closed.');
              setShowPaymentModal(false);
              fetchData();
            } else {
              alert('Payment received but verification failed. Contact support.');
            }
          } catch (verifyErr) {
            console.error('Verification error:', verifyErr);
            alert(verifyErr.response?.data?.error?.message || 'Payment verification failed.');
          }
        },
        prefill: { name: selectedBill.session?.customerIds?.map(c => c.name).join(', ') || 'Customer' },
        notes: { billId: selectedBill._id },
        theme: { color: '#1e90ff' },
        modal: { ondismiss: () => setRazorpayLoading(false) },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        alert(`Payment failed: ${response.error.description}`);
        setRazorpayLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.error('Razorpay error:', err);
      alert(err.response?.data?.error?.message || 'Failed to initiate Razorpay payment.');
    } finally {
      setRazorpayLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (paymentParams.method === 'upi') {
      await handleRazorpayPayment();
    } else {
      await handleManualPayment();
    }
  };

  const getPaymentForBill = (billId) => {
    return payments.find(p => p.bill && (p.bill._id === billId || p.bill === billId));
  };

  const filteredActiveSessions = activeSessions.filter(session => {
    if (!sessionSearch.trim()) return true;
    const term = sessionSearch.toLowerCase().trim();
    const tableNum = String(session.table?.tableNumber || '1').toLowerCase();
    const diners = (session.customerIds?.map(c => c.name).join(' ') || 'Anonymous Diner').toLowerCase();
    const token = (session.joinToken || '').toLowerCase();
    return tableNum.includes(term) || `table ${tableNum}`.includes(term) || `t${tableNum}`.includes(term) || diners.includes(term) || token.includes(term);
  });

  const filteredBills = bills.filter(bill => {
    if (!billSearch.trim()) return true;
    const term = billSearch.toLowerCase().trim();
    const formattedBillNum = formatBillNumber(bill.billNumber, bill._id).toLowerCase();
    const rawBillId = (bill._id || '').slice(-6).toLowerCase();
    const tableNum = String(bill.session?.table?.tableNumber || '1').toLowerCase();
    const amount = String((bill.grandTotal || 0).toFixed(0));
    const status = bill.isPaid ? 'paid' : 'unpaid';
    return formattedBillNum.includes(term) || rawBillId.includes(term) || tableNum.includes(term) || `table ${tableNum}`.includes(term) || amount.includes(term) || status.includes(term);
  });

  if (loading && activeSessions.length === 0 && bills.length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}><h2>Loading billing records...</h2></div>;
  }

  return (
    <div>
      <div className="admin-header">
        <h1>Billing &amp; Payments</h1>
        <button className="btn-add" onClick={fetchData}>Refresh Data</button>
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
              These tables are currently occupied. Bills generate automatically when customers click Finish Dining.
            </p>
          </div>
          <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '400px' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#636e72', fontSize: '1.2rem', pointerEvents: 'none' }}>search</span>
            <input type="text" placeholder="Search table, diner or token..." value={sessionSearch}
              onChange={(e) => setSessionSearch(e.target.value)} className="form-control"
              style={{ paddingLeft: '35px', paddingRight: '35px', width: '100%', boxSizing: 'border-box', margin: 0 }} />
            {sessionSearch && (
              <button onClick={() => setSessionSearch('')}
                style={{ position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#636e72', padding: '0 5px' }}
                title="Clear search">&times;</button>
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
                  <th>Table</th><th>Diners</th><th>Join Token</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredActiveSessions.map(session => (
                  <tr key={session._id}>
                    <td><strong>Table {session.table?.tableNumber || '1'}</strong> ({session.table?.location})</td>
                    <td>{session.customerIds?.map(c => c.name).join(', ') || 'Anonymous Diner'}</td>
                    <td><code>{session.joinToken}</code></td>
                    <td><span className="badge badge-info">Active Dining</span></td>
                    <td>
                      <button className="btn-add" onClick={() => openGenerateBillModal(session)} style={{ backgroundColor: '#1e90ff' }}>
                        Generate Bill
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SECTION 2: Generated Bills & Pending Payments */}
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px', marginBottom: '1.5rem' }}>
          <div style={{ flex: '1 1 300px' }}>
            <h2 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Billing &amp; Invoices</h2>
            <p style={{ color: '#636e72', fontSize: '0.9rem', marginBottom: 0 }}>All generated bills and payment statuses.</p>
          </div>
          <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '400px' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#636e72', fontSize: '1.2rem', pointerEvents: 'none' }}>search</span>
            <input type="text" placeholder="Search bill ID, table, amount or status..." value={billSearch}
              onChange={(e) => setBillSearch(e.target.value)} className="form-control"
              style={{ paddingLeft: '35px', paddingRight: '35px', width: '100%', boxSizing: 'border-box', margin: 0 }} />
            {billSearch && (
              <button onClick={() => setBillSearch('')}
                style={{ position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#636e72', padding: '0 5px' }}
                title="Clear search">&times;</button>
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
                <th>Bill ID</th><th>Table</th><th>Amount</th><th>Payment Status</th><th>Method</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.map(bill => {
                const pm = getPaymentForBill(bill._id);
                const paymentStatus = bill.isPaid
                  ? 'Paid'
                  : pm && pm.status === 'pending'
                    ? `Payment Pending (${pm.method.toUpperCase()})`
                    : 'Unpaid / Pending';

                const methodDisplay = bill.method
                  ? bill.method.toUpperCase()
                  : pm
                    ? pm.method.toUpperCase()
                    : '-';

                return (
                  <tr key={bill._id}>
                    <td>BILL-{formatBillNumber(bill.billNumber, bill._id)}</td>
                    <td>Table {bill.session?.table?.tableNumber || '1'}</td>
                    <td><strong>₹{(bill.grandTotal || 0).toFixed(0)}</strong></td>
                    <td>
                      <span className={`badge ${bill.isPaid ? 'badge-success' : pm && pm.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                        {paymentStatus}
                      </span>
                    </td>
                    <td>{methodDisplay}</td>
                    <td>
                      {!bill.isPaid ? (
                        <button className="btn-add" onClick={() => openPaymentModal(bill, pm?.method || 'cash')} style={{ backgroundColor: '#2ed573', marginRight: '8px' }}>
                          Confirm Payment
                        </button>
                      ) : (
                        <button className="btn-edit" onClick={() => handlePrint(bill)}>Print Invoice</button>
                      )}
                    </td>
                  </tr>
                );
              })}
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
                <input type="number" min="0" required value={billParams.taxRate}
                  onChange={(e) => setBillParams({ ...billParams, taxRate: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 'bold' }}>Discount (Rs.)</label>
                <input type="number" min="0" required value={billParams.discount}
                  onChange={(e) => setBillParams({ ...billParams, discount: e.target.value })} style={inputStyle} />
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
            <h2>Confirm Counter Payment</h2>
            <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
              Amount Due: <strong>₹{(selectedBill.grandTotal || 0).toFixed(0)}</strong>
            </p>
            <form onSubmit={handlePaymentSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 'bold' }}>Payment Method</label>
                <select value={paymentParams.method} onChange={(e) => setPaymentParams({ ...paymentParams, method: e.target.value })} style={inputStyle}>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI / Online (Razorpay)</option>
                </select>
              </div>

              {paymentParams.method === 'upi' && (
                <div style={{ marginBottom: '1rem', padding: '12px 14px', background: 'linear-gradient(135deg, #667eea0d, #764ba20d)', border: '1px solid #667eea55', borderRadius: '8px', fontSize: '0.88rem', color: '#4a4a8a' }}>
                  <strong>Razorpay Secure Payment</strong><br />
                  A Razorpay payment popup will open. Customer can pay via UPI, Card, or NetBanking.
                </div>
              )}

              {paymentParams.method !== 'upi' && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 'bold' }}>Reference / Notes (Optional)</label>
                  <input type="text" value={paymentParams.reference}
                    onChange={(e) => setPaymentParams({ ...paymentParams, reference: e.target.value })}
                    placeholder="e.g. Counter Cash, Card Receipt #" style={inputStyle} />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
                <button type="button" className="btn-delete" onClick={() => setShowPaymentModal(false)} disabled={razorpayLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn-add"
                  style={{ backgroundColor: paymentParams.method === 'upi' ? '#667eea' : '#2ed573', opacity: razorpayLoading ? 0.7 : 1, cursor: razorpayLoading ? 'not-allowed' : 'pointer' }}
                  disabled={razorpayLoading}>
                  {razorpayLoading ? 'Opening Razorpay...' : paymentParams.method === 'upi' ? 'Pay via Razorpay' : 'Confirm & Close Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

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