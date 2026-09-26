import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import socket from '../../socket';
import { formatBillNumber } from '../../utils/numberFormatters';
import './Bill.css';

const Bill = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentPendingAtCounter, setPaymentPendingAtCounter] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  const fetchBillData = async () => {
    try {
      setLoading(true);
      const sessionId = localStorage.getItem('sessionId');
      
      let fetchedBill = null;

      if (id && id !== 'latest') {
        try {
          const res = await api.get(`/bills/session/${id}`);
          if (res.data.success && res.data.data.length > 0) {
            fetchedBill = res.data.data[res.data.data.length - 1];
          }
        } catch (e) {
          // Ignore fallback
        }
      }

      if (!fetchedBill && sessionId) {
        const res = await api.get(`/bills/session/${sessionId}`);
        if (res.data.success && res.data.data.length > 0) {
          fetchedBill = res.data.data[res.data.data.length - 1];
        }
      }

      if (!fetchedBill && id) {
        try {
          const orderRes = await api.get(`/orders/${id}`);
          if (orderRes.data.success) {
            const orderData = orderRes.data.data;
            fetchedBill = {
              _id: orderData._id,
              billNumber: orderData.orderNumber,
              createdAt: orderData.createdAt,
              session: orderData.session,
              items: (orderData.items || []).map(item => ({
                foodName: item.food?.name || 'Item',
                quantity: item.quantity,
                price: item.priceAtOrderTime,
                total: item.quantity * item.priceAtOrderTime
              })),
              subtotal: orderData.subtotal || 0,
              taxRate: 5,
              discount: 0,
              grandTotal: orderData.total || 0,
              isPaid: false
            };
          }
        } catch (e) {
          console.error(e);
        }
      }

      if (fetchedBill) {
        setBill(fetchedBill);
        if (fetchedBill.isPaid) {
          navigate('/payment-success', {
            state: {
              billNumber: formatBillNumber(fetchedBill.billNumber, fetchedBill._id),
              amount: fetchedBill.grandTotal,
              method: 'COMPLETED'
            }
          });
        }
      } else {
        setError('Bill not found');
      }
    } catch (err) {
      console.error('Error fetching bill:', err);
      setError('Failed to load bill details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillData();

    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      socket.emit('joinSession', sessionId);
    }

    const handleSessionClosed = () => {
      if (bill) {
        navigate('/payment-success', {
          state: {
            billNumber: formatBillNumber(bill.billNumber, bill._id),
            amount: bill.grandTotal,
            method: paymentMethod ? paymentMethod.toUpperCase() : 'COUNTER'
          }
        });
      }
    };

    const handlePaymentUpdated = ({ billId, status }) => {
      if (bill && bill._id === billId && status === 'success') {
        navigate('/payment-success', {
          state: {
            billNumber: formatBillNumber(bill.billNumber, bill._id),
            amount: bill.grandTotal,
            method: paymentMethod ? paymentMethod.toUpperCase() : 'PAID'
          }
        });
      }
    };

    socket.on('session:closed', handleSessionClosed);
    socket.on('payment:updated', handlePaymentUpdated);

    return () => {
      socket.off('session:closed', handleSessionClosed);
      socket.off('payment:updated', handlePaymentUpdated);
    };
  }, [id]);

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

  const handleUPIPayment = async () => {
    if (!bill) return;
    setProcessingPayment(true);
    setPaymentError('');

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setPaymentError('Failed to load Razorpay payment gateway. Please check your network connection.');
        setProcessingPayment(false);
        return;
      }

      const orderRes = await api.post('/payments/razorpay/create-order', { billId: bill._id });
      if (!orderRes.data.success) {
        setPaymentError('Failed to create payment order. Please try again.');
        setProcessingPayment(false);
        return;
      }

      const { orderId, amount, currency, keyId } = orderRes.data.data;

      const options = {
        key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: 'SmartServe Restaurant',
        description: `Payment for Bill #${formatBillNumber(bill.billNumber, bill._id)}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyRes = await api.post('/payments/razorpay/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              billId: bill._id,
            });

            if (verifyRes.data.success) {
              navigate('/payment-success', {
                state: {
                  billNumber: formatBillNumber(bill.billNumber, bill._id),
                  amount: bill.grandTotal,
                  method: 'UPI'
                }
              });
            } else {
              setPaymentError('Payment was not completed. Please try again.');
            }
          } catch (verifyErr) {
            console.error('Verification error:', verifyErr);
            setPaymentError('Payment was not completed. Please try again.');
          } finally {
            setProcessingPayment(false);
          }
        },
        theme: { color: '#2ed573' },
        modal: {
          ondismiss: () => {
            setProcessingPayment(false);
            setPaymentError('Payment was not completed. Please try again.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        setPaymentError('Payment was not completed. Please try again.');
        setProcessingPayment(false);
      });
      rzp.open();
    } catch (err) {
      console.error('UPI payment error:', err);
      setPaymentError('Payment was not completed. Please try again.');
      setProcessingPayment(false);
    }
  };

  const handleCounterPayment = async (selectedMethod) => {
    if (!bill) return;
    setProcessingPayment(true);
    setPaymentError('');
    setPaymentMethod(selectedMethod);

    try {
      const response = await api.post('/payments/select-counter-method', {
        billId: bill._id,
        method: selectedMethod
      });

      if (response.data.success) {
        setPaymentPendingAtCounter(true);
      } else {
        setPaymentError('Failed to record payment choice. Please try again.');
      }
    } catch (err) {
      console.error('Counter payment error:', err);
      setPaymentError(err.response?.data?.error?.message || 'Failed to request counter payment. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="bill-loading">
        <h2>Loading your bill...</h2>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="bill-loading">
        <h2>{error || 'Bill Not Found'}</h2>
        <button onClick={() => navigate('/orders')} className="btn-primary">Back to Orders</button>
      </div>
    );
  }

  const savedCustomer = JSON.parse(localStorage.getItem('customer') || '{}');
  const customerName = bill.session?.customerIds?.map(c => c.name).join(', ') || savedCustomer.name || 'Customer';
  const tableNumber = bill.session?.table?.tableNumber || '1';

  return (
    <div className="bill-page-container">
      <div className="bill-actions no-print">
        <button onClick={() => navigate('/orders')} className="btn-outline">← Back to Orders</button>
        <button onClick={handlePrint} className="btn-print">🖨️ Print Invoice</button>
      </div>

      <div className="bill-card" id="printable-bill">
        {/* Bill Header */}
        <div className="bill-header">
          <h1>SmartServe</h1>
          <p>52C South Street, Sivakasi</p>
          <p>Phone: +91 8300724846</p>
          <div className="bill-title">FINAL INVOICE</div>
        </div>

        {/* Bill Info */}
        <div className="bill-info">
          <div className="info-left">
            <p><strong>Customer:</strong> {customerName}</p>
            <p><strong>Table No:</strong> Table {tableNumber}</p>
          </div>
          <div className="info-right">
            <p><strong>Bill No:</strong> BILL-{formatBillNumber(bill.billNumber, bill._id)}</p>
            <p><strong>Date:</strong> {new Date(bill.createdAt).toLocaleDateString()}</p>
            <p><strong>Time:</strong> {new Date(bill.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
          </div>
        </div>

        {/* Bill Items Table */}
        <table className="bill-table">
          <thead>
            <tr>
              <th className="align-left">Item</th>
              <th className="align-center">Qty</th>
              <th className="align-right">Price</th>
              <th className="align-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(bill.items || []).map((item, idx) => (
              <tr key={idx}>
                <td className="align-left">{item.foodName || item.name}</td>
                <td className="align-center">{item.quantity}</td>
                <td className="align-right">₹{Number(item.price || 0).toFixed(2)}</td>
                <td className="align-right">₹{Number(item.total || (item.price * item.quantity)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Bill Totals */}
        <div className="bill-totals">
          <div className="total-row">
            <span>Subtotal:</span>
            <span>₹{Number(bill.subtotal || 0).toFixed(2)}</span>
          </div>
          <div className="total-row">
            <span>Tax (5% GST):</span>
            <span>₹{Number((bill.subtotal * (bill.taxRate || 5) / 100) || 0).toFixed(2)}</span>
          </div>
          {bill.discount > 0 && (
            <div className="total-row">
              <span>Discount:</span>
              <span>-₹{Number(bill.discount).toFixed(2)}</span>
            </div>
          )}
          <div className="total-row grand-total">
            <span>Grand Total:</span>
            <span>₹{Number(bill.grandTotal || 0).toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Options Section (No Print) */}
        <div className="no-print" style={{ marginTop: '24px', paddingTop: '20px', borderTop: '2px dashed #ddd' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', textAlign: 'center', color: '#2c3e50' }}>
            Select Payment Method
          </h3>

          {paymentError && (
            <div style={{
              backgroundColor: '#ffeaa7',
              color: '#d63031',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '16px',
              textAlign: 'center',
              fontWeight: '600'
            }}>
              {paymentError}
            </div>
          )}

          {paymentPendingAtCounter ? (
            <div style={{
              backgroundColor: '#eccc68',
              color: '#2f3542',
              padding: '18px',
              borderRadius: '12px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⏳</div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '1.15rem' }}>Please complete your payment at the counter.</h4>
              <p style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 'bold' }}>
                Payment Method: {paymentMethod.toUpperCase()}
              </p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#57606f' }}>
                Payment Pending. Please complete your payment before leaving.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* UPI Option */}
              <button
                onClick={handleUPIPayment}
                disabled={processingPayment}
                style={{
                  backgroundColor: '#2ed573',
                  color: 'white',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '10px',
                  fontSize: '1.05rem',
                  fontWeight: 'bold',
                  cursor: processingPayment ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 10px rgba(46, 213, 115, 0.3)'
                }}
              >
                <span>📱</span> {processingPayment ? 'Processing UPI...' : 'Pay Now – UPI'}
              </button>

              <div style={{ display: 'flex', gap: '12px' }}>
                {/* Card Option */}
                <button
                  onClick={() => handleCounterPayment('card')}
                  disabled={processingPayment}
                  style={{
                    flex: 1,
                    backgroundColor: '#1e90ff',
                    color: 'white',
                    border: 'none',
                    padding: '14px',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: processingPayment ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>💳</span> Card
                </button>

                {/* Cash Option */}
                <button
                  onClick={() => handleCounterPayment('cash')}
                  disabled={processingPayment}
                  style={{
                    flex: 1,
                    backgroundColor: '#ffa502',
                    color: 'white',
                    border: 'none',
                    padding: '14px',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: processingPayment ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>💵</span> Cash
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bill Footer */}
        <div className="bill-footer" style={{ marginTop: '24px' }}>
          <p>Thank you for dining with us!</p>
          <p>Please visit again.</p>
        </div>
      </div>
    </div>
  );
};

export default Bill;
