const express = require('express');
const router = express.Router();
const { 
  getSales, getTopItems, getOrderStats, getPaymentStats, getFeedbackStats, getDashboardStats,
  getReportSummary, getFoodWiseReport, getDailyReport, getMonthlyReport,
  getExpenses, createExpense, updateExpense, deleteExpense
} = require('../controllers/reportController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.use(authenticate, authorize('admin'));

// Existing routes (preserved)
router.get('/sales', getSales);
router.get('/top-items', getTopItems);
router.get('/orders', getOrderStats);
router.get('/payments', getPaymentStats);
router.get('/feedback', getFeedbackStats);
router.get('/dashboard-stats', getDashboardStats);

// New Analytics & Report Routes
router.get('/summary', getReportSummary);
router.get('/food-wise', getFoodWiseReport);
router.get('/daily', getDailyReport);
router.get('/monthly', getMonthlyReport);

// Expense Routes
router.route('/expenses')
  .get(getExpenses)
  .post(createExpense);

router.route('/expenses/:id')
  .put(updateExpense)
  .delete(deleteExpense);

module.exports = router;
