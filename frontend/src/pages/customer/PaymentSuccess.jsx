import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};

  const billNumber = state.billNumber || 'BILL-0008';
  const amountPaid = state.amount ? `₹${Number(state.amount).toFixed(0)}` : '₹450';
  const paymentMethod = state.method || 'UPI';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      padding: '24px 16px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        padding: '40px 24px',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 12px 32px rgba(46, 213, 115, 0.15)',
        border: '1px solid #2ed573',
        boxSizing: 'border-box'
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          backgroundColor: '#2ed573',
          color: 'white',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.5rem',
          margin: '0 auto 20px auto',
          boxShadow: '0 8px 20px rgba(46, 213, 115, 0.3)'
        }}>
          ✓
        </div>

        <h1 style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: '1.8rem',
          color: '#2ed573',
          margin: '0 0 16px 0',
          fontWeight: '700'
        }}>
          Payment Successful
        </h1>

        <div style={{
          backgroundColor: '#f8f9fa',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: '#636e72', fontWeight: '500' }}>Bill No:</span>
            <strong style={{ color: '#2d3436' }}>{billNumber.startsWith('BILL-') ? billNumber : `BILL-${billNumber}`}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: '#636e72', fontWeight: '500' }}>Amount Paid:</span>
            <strong style={{ color: '#2ed573', fontSize: '1.1rem' }}>{amountPaid}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#636e72', fontWeight: '500' }}>Payment Method:</span>
            <strong style={{ color: '#2d3436' }}>{paymentMethod}</strong>
          </div>
        </div>

        <p style={{
          fontSize: '1.1rem',
          color: '#2d3436',
          fontWeight: '600',
          margin: '0 0 8px 0'
        }}>
          Thank you for dining with us!
        </p>

        <p style={{
          fontSize: '0.9rem',
          color: '#636e72',
          margin: '0 0 28px 0',
          lineHeight: '1.5'
        }}>
          Your payment has been recorded and your dining session is completed. We look forward to serving you again.
        </p>

        <button
          onClick={() => navigate('/home')}
          style={{
            background: 'linear-gradient(135deg, #2ed573 0%, #26af5f 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '14px 32px',
            borderRadius: '9999px',
            fontSize: '0.95rem',
            fontWeight: '700',
            fontFamily: "'Poppins', sans-serif",
            cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(46, 213, 115, 0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
        >
          Return to Restaurant Home
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
