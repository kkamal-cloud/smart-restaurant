import React from 'react';
import { useNavigate } from 'react-router-dom';

const SessionEnded = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '75vh',
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
        boxShadow: '0 12px 32px rgba(80, 30, 0, 0.1)',
        border: '1px solid #D4B896',
        boxSizing: 'border-box'
      }}>
        <div style={{
          fontSize: '3.5rem',
          marginBottom: '16px',
          lineHeight: '1'
        }}>
          🙏
        </div>

        <h1 style={{
          fontFamily: "'Cinzel', 'Georgia', serif",
          fontSize: '1.8rem',
          color: '#C94B2C',
          margin: '0 0 12px 0',
          fontWeight: '700'
        }}>
          Thank You!
        </h1>

        <p style={{
          fontSize: '1.05rem',
          color: '#2C1A0E',
          fontWeight: '600',
          margin: '0 0 8px 0'
        }}>
          Your dining session has been completed.
        </p>

        <p style={{
          fontSize: '0.9rem',
          color: '#5C3D1E',
          margin: '0 0 28px 0',
          lineHeight: '1.5'
        }}>
          We hope you enjoyed your meal! You can safely close this browser window.
        </p>

        <button
          onClick={() => navigate('/home')}
          style={{
            background: 'linear-gradient(135deg, #C94B2C 0%, #A33A1F 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '12px 28px',
            borderRadius: '9999px',
            fontSize: '0.9rem',
            fontWeight: '700',
            fontFamily: "'Poppins', sans-serif",
            cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(201, 75, 44, 0.25)',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
        >
          Return to Restaurant Home
        </button>
      </div>
    </div>
  );
};

export default SessionEnded;
