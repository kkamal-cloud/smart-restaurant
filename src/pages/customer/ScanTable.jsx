import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';

const ScanTable = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [table, setTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [joinToken, setJoinToken] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    resolveQRToken();
  }, [token]);

  const resolveQRToken = async () => {
    try {
      const response = await api.get(`/qr/${token}`);
      if (response.data.success) {
        setTable(response.data.data);
      } else {
        setError('Invalid QR code');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to resolve QR code or invalid token');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    try {
      const payload = {
        tableId: table.id,
        customerName,
        phone: phone || undefined,
      };

      if (isJoining && joinToken) {
        payload.joinToken = joinToken;
      }

      const response = await api.post('/sessions', payload);
      
      if (response.data.success) {
        const { sessionId, joinToken: returnedJoinToken, customer } = response.data.data;
        // Save session details to localStorage
        localStorage.setItem('sessionId', sessionId);
        localStorage.setItem('joinToken', returnedJoinToken);
        localStorage.setItem('customer', JSON.stringify(customer));

        // Redirect to menu page
        navigate('/menu');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error?.message || 'Failed to start session');
    }
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h2>Resolving Table...</h2>
          <p>Please wait while we verify your table details.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <div style={{...cardStyle, borderColor: '#f44336'}}>
          <h2 style={{color: '#f44336'}}>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} style={btnStyle}>Go to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={{ marginBottom: '5px' }}>Welcome!</h2>
        <h3 style={{ color: '#ff6b6b', margin: '0 0 20px 0' }}>
          Table {table.tableNumber} ({table.location})
        </h3>

        {!table.isAvailable && (
          <div style={alertWarningStyle}>
            This table currently has an active session. If you are dining with friends, you can join their session using their Join Token. Otherwise, starting a new session will create a separate bill.
          </div>
        )}

        <form onSubmit={handleStartSession}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Your Name *</label>
            <input 
              type="text" 
              required 
              value={customerName} 
              onChange={(e) => setCustomerName(e.target.value)} 
              placeholder="Enter your name"
              style={inputStyle}
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Phone Number (Optional)</label>
            <input 
              type="tel" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              placeholder="Enter phone number"
              style={inputStyle}
            />
          </div>

          {!table.isAvailable && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={isJoining} 
                  onChange={(e) => setIsJoining(e.target.checked)} 
                />
                Join an existing session on this table?
              </label>
              
              {isJoining && (
                <div style={{ marginTop: '10px' }}>
                  <label style={labelStyle}>Join Token *</label>
                  <input 
                    type="text" 
                    required={isJoining} 
                    value={joinToken} 
                    onChange={(e) => setJoinToken(e.target.value)} 
                    placeholder="Enter friend's Join Token"
                    style={inputStyle}
                  />
                </div>
              )}
            </div>
          )}

          <button type="submit" style={btnStyle}>
            {isJoining ? 'Join Session & View Menu' : 'Start Dining & View Menu'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Styling
const containerStyle = {
  display: 'flex', justifyContent: 'center', alignItems: 'center',
  minHeight: '80vh', padding: '20px', backgroundColor: '#f9f9f9'
};
const cardStyle = {
  backgroundColor: 'white', padding: '40px 30px', borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)', width: '100%', maxWidth: '450px',
  border: '1px solid #eee'
};
const formGroupStyle = {
  marginBottom: '20px'
};
const labelStyle = {
  display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333'
};
const inputStyle = {
  width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc',
  fontSize: '1rem', boxSizing: 'border-box'
};
const btnStyle = {
  width: '100%', padding: '14px', borderRadius: '8px', border: 'none',
  backgroundColor: '#ff6b6b', color: 'white', fontWeight: '600', fontSize: '1rem',
  cursor: 'pointer', marginTop: '10px', boxShadow: '0 4px 6px rgba(255,107,107,0.2)'
};
const alertWarningStyle = {
  backgroundColor: '#fff3cd', color: '#856404', padding: '15px', borderRadius: '8px',
  fontSize: '0.9rem', marginBottom: '20px', border: '1px solid #ffeeba', lineHeight: '1.4'
};

export default ScanTable;
