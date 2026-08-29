import React from 'react';
import './AdminStyles.css';

const Reports = () => {
  return (
    <div>
      <div className="admin-header">
        <h1>Reports & Analytics</h1>
      </div>

      <div className="admin-grid-4" style={{marginBottom: '2rem'}}>
        <div className="admin-card">
          <h3 style={{color: '#57606f', margin: '0 0 10px 0'}}>Total Revenue</h3>
          <div style={{fontSize: '1.8rem', fontWeight: 'bold', color: '#2f3542'}}>₹ 45,890</div>
          <p style={{color: '#2ed573', margin: '5px 0 0 0', fontSize: '0.9rem'}}>↑ 12% from last week</p>
        </div>
        <div className="admin-card">
          <h3 style={{color: '#57606f', margin: '0 0 10px 0'}}>Total Orders</h3>
          <div style={{fontSize: '1.8rem', fontWeight: 'bold', color: '#2f3542'}}>124</div>
        </div>
        <div className="admin-card">
          <h3 style={{color: '#57606f', margin: '0 0 10px 0'}}>Avg. Order Value</h3>
          <div style={{fontSize: '1.8rem', fontWeight: 'bold', color: '#2f3542'}}>₹ 370</div>
        </div>
      </div>

      <div className="admin-card">
        <h2>Popular Items (Mock Data)</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Category</th>
              <th>Units Sold</th>
              <th>Revenue Generated</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Chicken Biryani</td>
              <td>Main Course</td>
              <td>45</td>
              <td>₹ 15,705</td>
            </tr>
            <tr>
              <td>Margherita Pizza</td>
              <td>Pizza</td>
              <td>32</td>
              <td>₹ 9,568</td>
            </tr>
            <tr>
              <td>Chicken 65</td>
              <td>Starters</td>
              <td>28</td>
              <td>₹ 6,972</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;
