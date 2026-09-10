import React, { useState, useEffect } from 'react';
import api from '../../api';
import './AdminStyles.css';

const Reports = () => {
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('today'); // 'today', 'month', 'custom'
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [summary, setSummary] = useState(null);
    const [foodWise, setFoodWise] = useState([]);
    const [expenses, setExpenses] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');

    // Expense Modal State
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [expenseForm, setExpenseForm] = useState({ title: '', amount: '', date: '', category: 'General' });
    const [editingExpenseId, setEditingExpenseId] = useState(null);
    const [expenseSubmitting, setExpenseSubmitting] = useState(false);

    const fetchReports = async () => {
        try {
            setLoading(true);
            let query = `?period=${period}`;
            if (period === 'custom') {
                if (!startDate || !endDate) return; // wait for valid range
                query = `?startDate=${startDate}&endDate=${endDate}`;
            }

            const [sumRes, fwRes, expRes] = await Promise.all([
                api.get(`/reports/summary${query}`),
                api.get(`/reports/food-wise${query}`),
                api.get(`/reports/expenses${query}`)
            ]);

            if (sumRes.data.success) setSummary(sumRes.data.data);
            if (fwRes.data.success) setFoodWise(fwRes.data.data);
            if (expRes.data.success) setExpenses(expRes.data.data);
        } catch (err) {
            console.error('Error fetching reports:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (period !== 'custom' || (startDate && endDate)) {
            fetchReports();
        }
    }, [period, startDate, endDate]);

    const handleExpenseSubmit = async (e) => {
        e.preventDefault();
        try {
            setExpenseSubmitting(true);
            const payload = {
                ...expenseForm,
                amount: Number(expenseForm.amount),
                date: expenseForm.date || new Date()
            };

            if (editingExpenseId) {
                await api.put(`/reports/expenses/${editingExpenseId}`, payload);
            } else {
                await api.post('/reports/expenses', payload);
            }

            // Reset & refresh
            setExpenseForm({ title: '', amount: '', date: '', category: 'General' });
            setEditingExpenseId(null);
            fetchReports(); // updates summary, expenses, net profit!
        } catch (err) {
            console.error('Error saving expense:', err);
            alert('Failed to save expense');
        } finally {
            setExpenseSubmitting(false);
        }
    };

    const handleEditExpense = (exp) => {
        setExpenseForm({
            title: exp.title,
            amount: exp.amount,
            date: new Date(exp.date).toISOString().split('T')[0],
            category: exp.category
        });
        setEditingExpenseId(exp._id);
    };

    const handleDeleteExpense = async (id) => {
        if (!window.confirm('Delete this expense?')) return;
        try {
            await api.delete(`/reports/expenses/${id}`);
            fetchReports();
        } catch (err) {
            console.error('Error deleting expense:', err);
            alert('Failed to delete expense');
        }
    };

    const openExpenseModal = () => {
        setExpenseForm({ title: '', amount: '', date: new Date().toISOString().split('T')[0], category: 'General' });
        setEditingExpenseId(null);
        setIsExpenseModalOpen(true);
    };

    const filteredFoodWise = foodWise.filter(item => item.foodName.toLowerCase().includes(searchTerm.toLowerCase()));

    const totalFilteredQty = filteredFoodWise.reduce((sum, i) => sum + i.quantitySold, 0);
    const totalFilteredSales = filteredFoodWise.reduce((sum, i) => sum + i.totalSales, 0);
    const totalFilteredCost = filteredFoodWise.reduce((sum, i) => sum + i.totalCost, 0);
    const totalFilteredProfit = filteredFoodWise.reduce((sum, i) => sum + i.profit, 0);

    return (
        <div>
            <div className="admin-header">
                <div>
                    <h1>Reports & Profit Analysis</h1>
                    <p>Financial overview, food cost calculations, expense tracking & net profit</p>
                </div>
                <button className="btn-add" onClick={openExpenseModal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined">account_balance_wallet</span>
                    Manage Expenses
                </button>
            </div>

            {/* FILTER BAR */}
            <div className="admin-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center', padding: '15px 20px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        className={`btn-secondary ${period === 'today' ? 'active' : ''}`}
                        style={{ background: period === 'today' ? 'var(--ep-primary)' : '', color: period === 'today' ? '#fff' : '' }}
                        onClick={() => setPeriod('today')}
                    >
                        Today
                    </button>
                    <button
                        className={`btn-secondary ${period === 'month' ? 'active' : ''}`}
                        style={{ background: period === 'month' ? 'var(--ep-primary)' : '', color: period === 'month' ? '#fff' : '' }}
                        onClick={() => setPeriod('month')}
                    >
                        This Month
                    </button>
                    <button
                        className={`btn-secondary ${period === 'custom' ? 'active' : ''}`}
                        style={{ background: period === 'custom' ? 'var(--ep-primary)' : '', color: period === 'custom' ? '#fff' : '' }}
                        onClick={() => setPeriod('custom')}
                    >
                        Custom Range
                    </button>
                </div>

                {period === 'custom' && (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input type="date" className="form-control" style={{ width: 'auto' }} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        <span style={{ color: 'var(--ep-on-surface-variant)' }}>to</span>
                        <input type="date" className="form-control" style={{ width: 'auto' }} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                )}

                <div style={{ marginLeft: 'auto', fontSize: '0.9rem', color: 'var(--ep-on-surface-variant)' }}>
                    {summary && summary.dateRange && (
                        <span>
                            Showing: <strong>{new Date(summary.dateRange.start).toLocaleDateString()}</strong> – <strong>{new Date(summary.dateRange.end).toLocaleDateString()}</strong>
                        </span>
                    )}
                </div>
            </div>

            {loading && !summary ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="kitchen-spinner" style={{ margin: '0 auto', borderColor: 'var(--ep-primary)', borderTopColor: 'transparent' }}></div>
                    <p style={{ marginTop: '10px', color: 'var(--ep-on-surface-variant)' }}>Analyzing financial data...</p>
                </div>
            ) : summary ? (
                <>
                    {/* SUMMARY CARDS */}
                    <div className="admin-grid-4" style={{ marginBottom: '2rem' }}>
                        <div className="admin-card" style={{ borderBottom: '4px solid #1e90ff' }}>
                            <h3 style={{ color: 'var(--ep-on-surface-variant)', margin: '0 0 10px 0', fontSize: '1rem' }}>Total Sales</h3>
                            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--ep-on-surface)', fontFamily: 'var(--font-display)' }}>
                                ₹ {summary.totalSales.toLocaleString()}
                            </div>
                            <p style={{ color: 'var(--ep-on-surface-variant)', margin: '5px 0 0 0', fontSize: '0.85rem' }}>
                                From {summary.totalBills} completed orders
                            </p>
                        </div>
                        <div className="admin-card" style={{ borderBottom: '4px solid #ffa502' }}>
                            <h3 style={{ color: 'var(--ep-on-surface-variant)', margin: '0 0 10px 0', fontSize: '1rem' }}>Total Food Cost</h3>
                            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--ep-on-surface)', fontFamily: 'var(--font-display)' }}>
                                ₹ {summary.totalFoodCost.toLocaleString()}
                            </div>
                            <p style={{ color: 'var(--ep-on-surface-variant)', margin: '5px 0 0 0', fontSize: '0.85rem' }}>
                                {summary.totalSales > 0 ? ((summary.totalFoodCost / summary.totalSales) * 100).toFixed(1) : 0}% of sales
                            </p>
                        </div>
                        <div className="admin-card" style={{ borderBottom: '4px solid #ff4757', cursor: 'pointer' }} onClick={openExpenseModal}>
                            <h3 style={{ color: 'var(--ep-on-surface-variant)', margin: '0 0 10px 0', fontSize: '1rem' }}>Total Expenses</h3>
                            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--ep-on-surface)', fontFamily: 'var(--font-display)' }}>
                                ₹ {summary.totalExpenses.toLocaleString()}
                            </div>
                            <p style={{ color: 'var(--ep-primary)', margin: '5px 0 0 0', fontSize: '0.85rem', fontWeight: '600' }}>
                                View & Manage ➔
                            </p>
                        </div>
                        <div className="admin-card" style={{ borderBottom: `4px solid ${summary.netProfit >= 0 ? '#2ed573' : '#ff4757'}`, background: summary.netProfit >= 0 ? 'var(--ep-tertiary-container)' : 'var(--ep-error-container)' }}>
                            <h3 style={{ color: summary.netProfit >= 0 ? 'var(--ep-on-tertiary-container)' : 'var(--ep-on-error-container)', margin: '0 0 10px 0', fontSize: '1rem' }}>Net Profit</h3>
                            <div style={{ fontSize: '2rem', fontWeight: '800', color: summary.netProfit >= 0 ? 'var(--ep-on-tertiary-container)' : 'var(--ep-on-error-container)', fontFamily: 'var(--font-display)' }}>
                                ₹ {summary.netProfit.toLocaleString()}
                            </div>
                            <p style={{ color: summary.netProfit >= 0 ? 'var(--ep-on-tertiary-container)' : 'var(--ep-on-error-container)', margin: '5px 0 0 0', fontSize: '0.8rem', opacity: 0.9 }}>
                                Sales - Food Cost - Expenses
                            </p>
                        </div>
                    </div>

                    {/* HIGHLIGHTS */}
                    <div className="admin-grid-4" style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                        <div className="admin-card" style={{ background: 'linear-gradient(135deg, var(--ep-surface-container), var(--ep-surface-container-high))' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ color: 'var(--ep-on-surface-variant)', margin: '0 0 5px 0', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Best-Selling Food</h3>
                                    <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--ep-on-surface)' }}>
                                        {summary.bestSellingFood ? summary.bestSellingFood.foodName : 'N/A'}
                                    </div>
                                </div>
                                <span className="material-symbols-outlined" style={{ color: 'var(--gold)', fontSize: '2rem' }}>workspace_premium</span>
                            </div>
                            {summary.bestSellingFood && (
                                <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--ep-on-surface-variant)' }}>Units Sold</div>
                                        <div style={{ fontWeight: '600' }}>{summary.bestSellingFood.quantitySold}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--ep-on-surface-variant)' }}>Sales</div>
                                        <div style={{ fontWeight: '600', color: 'var(--ep-primary)' }}>₹{summary.bestSellingFood.totalSales.toLocaleString()}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="admin-card" style={{ background: 'linear-gradient(135deg, var(--ep-surface-container), var(--ep-surface-container-high))' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ color: 'var(--ep-on-surface-variant)', margin: '0 0 5px 0', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Most Profitable Food</h3>
                                    <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--ep-on-surface)' }}>
                                        {summary.mostProfitableFood ? summary.mostProfitableFood.foodName : 'N/A'}
                                    </div>
                                </div>
                                <span className="material-symbols-outlined" style={{ color: '#2ed573', fontSize: '2rem' }}>trending_up</span>
                            </div>
                            {summary.mostProfitableFood && (
                                <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--ep-on-surface-variant)' }}>Profit</div>
                                        <div style={{ fontWeight: '600', color: '#2ed573' }}>₹{summary.mostProfitableFood.profit.toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--ep-on-surface-variant)' }}>Margin</div>
                                        <div style={{ fontWeight: '600' }}>
                                            {summary.mostProfitableFood.totalSales > 0 ? ((summary.mostProfitableFood.profit / summary.mostProfitableFood.totalSales) * 100).toFixed(1) : 0}%
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* VISUAL ANALYTICS (SVG BARS) */}
                    {foodWise.length > 0 && (
                        <div className="admin-card" style={{ marginBottom: '2rem' }}>
                            <h2 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-display)' }}>Top 5 Performers (Revenue vs Profit)</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {foodWise.slice(0, 5).map((item, idx) => {
                                    const maxSales = Math.max(...foodWise.slice(0, 5).map(i => i.totalSales));
                                    const salesWidth = (item.totalSales / maxSales) * 100;
                                    const profitWidth = (item.profit / maxSales) * 100; // relative to max sales for scale

                                    return (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center' }}>
                                            <div style={{ width: '150px', fontSize: '0.9rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {item.foodName}
                                            </div>
                                            <div style={{ flex: 1, position: 'relative', height: '24px', background: 'var(--ep-surface-container-high)', borderRadius: '4px', overflow: 'hidden' }}>
                                                {/* Sales Bar */}
                                                <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${salesWidth}%`, background: 'var(--gold-light)', opacity: 0.5 }}></div>
                                                {/* Profit Bar */}
                                                <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${Math.max(profitWidth, 0)}%`, background: 'var(--gold)', transition: 'width 0.5s ease' }}></div>

                                                <div style={{ position: 'absolute', top: 0, left: '8px', height: '100%', display: 'flex', alignItems: 'center', fontSize: '0.75rem', fontWeight: '700', color: 'var(--ep-on-surface)' }}>
                                                    S: ₹{item.totalSales.toLocaleString()} | P: ₹{item.profit.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--ep-on-surface-variant)', marginTop: '10px' }}>
                                <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'var(--gold-light)', opacity: 0.5, marginRight: '5px', borderRadius: '2px' }}></span> Revenue
                                <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'var(--gold)', marginRight: '5px', marginLeft: '15px', borderRadius: '2px' }}></span> Profit
                            </p>
                        </div>
                    )}

                    {/* FOOD-WISE TABLE */}
                    <div className="admin-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Food-wise Breakdown</h2>
                            <input
                                type="text"
                                placeholder="Search food..."
                                className="form-control"
                                style={{ width: '250px' }}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Food Name</th>
                                        <th style={{ textAlign: 'right' }}>Qty Sold</th>
                                        <th style={{ textAlign: 'right' }}>Selling Price</th>
                                        <th style={{ textAlign: 'right' }}>Cost Price</th>
                                        <th style={{ textAlign: 'right' }}>Total Sales</th>
                                        <th style={{ textAlign: 'right' }}>Total Cost</th>
                                        <th style={{ textAlign: 'right' }}>Profit</th>
                                        <th style={{ textAlign: 'right' }}>Margin</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredFoodWise.map((item, idx) => (
                                        <tr key={idx}>
                                            <td style={{ fontWeight: '600' }}>{item.foodName}</td>
                                            <td style={{ textAlign: 'right' }}>{item.quantitySold}</td>
                                            <td style={{ textAlign: 'right' }}>₹{item.sellingPrice.toLocaleString()}</td>
                                            <td style={{ textAlign: 'right', color: item.costPrice === 0 ? 'var(--ep-primary)' : 'var(--ep-on-surface-variant)' }}>
                                                {item.costPrice === 0 ? <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>₹0 (Unset)</span> : `₹${item.costPrice.toLocaleString()}`}
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: '600' }}>₹{item.totalSales.toLocaleString()}</td>
                                            <td style={{ textAlign: 'right' }}>₹{item.totalCost.toLocaleString()}</td>
                                            <td style={{ textAlign: 'right', fontWeight: '700', color: item.profit >= 0 ? '#2ed573' : '#ff4757' }}>
                                                ₹{item.profit.toLocaleString()}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <span className={`badge ${item.profit > 0 ? 'badge-success' : 'badge-secondary'}`}>
                                                    {item.totalSales > 0 ? ((item.profit / item.totalSales) * 100).toFixed(1) : 0}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredFoodWise.length === 0 && (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: 'var(--ep-on-surface-variant)' }}>
                                                No items found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                {filteredFoodWise.length > 0 && (
                                    <tfoot style={{ background: 'var(--ep-surface-container-high)', fontWeight: 'bold' }}>
                                        <tr>
                                            <td>TOTALS</td>
                                            <td style={{ textAlign: 'right' }}>{totalFilteredQty}</td>
                                            <td></td>
                                            <td></td>
                                            <td style={{ textAlign: 'right' }}>₹{totalFilteredSales.toLocaleString()}</td>
                                            <td style={{ textAlign: 'right' }}>₹{totalFilteredCost.toLocaleString()}</td>
                                            <td style={{ textAlign: 'right', color: totalFilteredProfit >= 0 ? '#2ed573' : '#ff4757' }}>₹{totalFilteredProfit.toLocaleString()}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                {totalFilteredSales > 0 ? ((totalFilteredProfit / totalFilteredSales) * 100).toFixed(1) : 0}%
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                            <p style={{ fontSize: '0.75rem', color: 'var(--ep-on-surface-variant)', marginTop: '10px', textAlign: 'right' }}>
                                * Cost Price is sourced from current Menu settings. If historical cost tracking is needed, please update items in Menu Management.
                            </p>
                        </div>
                    </div>
                </>
            ) : null}

            {/* EXPENSE MANAGEMENT MODAL */}
            {isExpenseModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
                        <div className="modal-header">
                            <h2>Expense Management</h2>
                            <button className="modal-close" onClick={() => setIsExpenseModalOpen(false)}>×</button>
                        </div>
                        <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                            {/* Form Side */}
                            <div style={{ background: 'var(--ep-surface-container-low)', padding: '20px', borderRadius: 'var(--r-md)' }}>
                                <h3 style={{ marginTop: 0, marginBottom: '15px' }}>{editingExpenseId ? 'Edit Expense' : 'Add New Expense'}</h3>
                                <form onSubmit={handleExpenseSubmit} className="admin-form">
                                    <div className="form-group">
                                        <label>Title / Description*</label>
                                        <input type="text" className="form-control" required value={expenseForm.title} onChange={e => setExpenseForm({ ...expenseForm, title: e.target.value })} placeholder="e.g. Electricity Bill" />
                                    </div>
                                    <div className="form-group">
                                        <label>Amount (₹)*</label>
                                        <input type="number" className="form-control" required min="0" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} placeholder="Amount" />
                                    </div>
                                    <div className="form-group">
                                        <label>Date*</label>
                                        <input type="date" className="form-control" required value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Category</label>
                                        <select className="form-control" value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                                            <option value="General">General</option>
                                            <option value="Utilities">Utilities (Electricity, Water, etc)</option>
                                            <option value="Staff">Staff / Salaries</option>
                                            <option value="Maintenance">Maintenance & Repairs</option>
                                            <option value="Ingredients">Ingredients & Packaging</option>
                                            <option value="Marketing">Marketing</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                        <button type="submit" className="btn-add" disabled={expenseSubmitting} style={{ flex: 1 }}>
                                            {expenseSubmitting ? 'Saving...' : (editingExpenseId ? 'Update Expense' : 'Add Expense')}
                                        </button>
                                        {editingExpenseId && (
                                            <button type="button" className="btn-secondary" onClick={() => { setEditingExpenseId(null); setExpenseForm({ title: '', amount: '', date: new Date().toISOString().split('T')[0], category: 'General' }); }}>
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>

                            {/* List Side */}
                            <div style={{ overflowY: 'auto', maxHeight: '500px', paddingRight: '10px' }}>
                                <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Expenses in Date Range</h3>
                                {expenses.length === 0 ? (
                                    <p style={{ color: 'var(--ep-on-surface-variant)' }}>No expenses recorded in this period.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {expenses.map(exp => (
                                            <div key={exp._id} style={{ background: 'var(--ep-surface-container)', padding: '12px 15px', borderRadius: 'var(--r-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontWeight: '600' }}>{exp.title}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--ep-on-surface-variant)' }}>
                                                        {new Date(exp.date).toLocaleDateString()} • {exp.category}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                    <div style={{ fontWeight: '700', color: 'var(--ep-error)' }}>₹{exp.amount.toLocaleString()}</div>
                                                    <div style={{ display: 'flex', gap: '5px' }}>
                                                        <button className="btn-edit" onClick={() => handleEditExpense(exp)} style={{ padding: '4px 8px', fontSize: '0.75rem', marginRight: 0 }}>Edit</button>
                                                        <button className="btn-delete" onClick={() => handleDeleteExpense(exp._id)} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>✕</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {expenses.length > 0 && (
                                    <div style={{ marginTop: '15px', padding: '15px', background: 'var(--ep-surface-container-high)', borderRadius: 'var(--r-md)', textAlign: 'right', fontWeight: '700' }}>
                                        Total List Expenses: ₹{expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
