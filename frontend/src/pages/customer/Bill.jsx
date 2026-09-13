import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import { formatOrderNumber } from '../../utils/numberFormatters';
import './Bill.css';

const Bill = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBillDetails = async () => {
      try {
        const response = await api.get(`/orders/${id}`);
        if (response.data.success) {
          const found = response.data.data;
          
          // Get current customer name from customerIds or localStorage
          const savedCustomer = JSON.parse(localStorage.getItem('customer') || '{}');
          const customerName = found.session?.customerIds?.map(c => c.name).join(', ') || savedCustomer.name || 'Customer';

          const formatted = {
            id: found._id,
            orderNumber: found.orderNumber,
            date: found.createdAt,
            status: found.status,
            customerName: customerName,
            tableNumber: found.session?.table?.tableNumber || '1',
            items: (found.items || []).map(item => ({
              id: item._id,
              name: item.food?.name || 'Item',
              price: item.priceAtOrderTime || 0,
              quantity: item.quantity
            })),
            subtotal: found.subtotal || 0,
            tax: found.tax || 0,
            total: found.total || 0
          };
          setOrder(formatted);
        }
      } catch (err) {
        console.error('Error fetching bill details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBillDetails();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="bill-loading">
        <h2>Loading Bill...</h2>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bill-loading">
        <h2>Bill Not Found</h2>
        <button onClick={() => navigate('/orders')} className="btn-primary">Back to Orders</button>
      </div>
    );
  }

  return (
    <div className="bill-page-container">
      <div className="bill-actions no-print">
        <button onClick={() => navigate('/orders')} className="btn-outline">← Back to Orders</button>
        <button onClick={handlePrint} className="btn-print">🖨️ Print Bill</button>
      </div>

      <div className="bill-card" id="printable-bill">
        {/* Bill Header */}
        <div className="bill-header">
          <h1>SmartServe</h1>
          <p>52C South Street , Sivakasi</p>
          <p>Phone: +91 8300724846</p>
          <div className="bill-title">INVOICE</div>
        </div>

        {/* Bill Info */}
        <div className="bill-info">
          <div className="info-left">
            <p><strong>Customer:</strong> {order.customerName}</p>
            <p><strong>Table No:</strong> {order.tableNumber}</p>
          </div>
          <div className="info-right">
            <p><strong>Order ID:</strong> {formatOrderNumber(order.orderNumber, order.id)}</p>

            <p><strong>Date:</strong> {new Date(order.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> {new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
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
            {order.items.map(item => (
              <tr key={item.id}>
                <td className="align-left">{item.name}</td>
                <td className="align-center">{item.quantity}</td>
                <td className="align-right">₹{item.price.toFixed(2)}</td>
                <td className="align-right">₹{(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Bill Totals */}
        <div className="bill-totals">
          <div className="total-row">
            <span>Subtotal:</span>
            <span>₹{order.subtotal.toFixed(2)}</span>
          </div>
          <div className="total-row">
            <span>Tax (5% GST):</span>
            <span>₹{order.tax.toFixed(2)}</span>
          </div>
          <div className="total-row grand-total">
            <span>Grand Total:</span>
            <span>₹{order.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Bill Footer */}
        <div className="bill-footer">
          <p>Thank you for dining with us!</p>
          <p>Please visit again.</p>
        </div>
      </div>
    </div>
  );
};

export default Bill;
