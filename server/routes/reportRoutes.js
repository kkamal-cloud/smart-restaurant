const express = require('express');
const router = express.Router();
const { getSales, getTopItems, getOrderStats, getPaymentStats, getFeedbackStats, getDashboardStats } = require('../controllers/reportController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.use(authenticate, authorize('admin'));

router.get('/sales', getSales);
router.get('/top-items', getTopItems);
router.get('/orders', getOrderStats);
router.get('/payments', getPaymentStats);
router.get('/feedback', getFeedbackStats);
router.get('/dashboard-stats', getDashboardStats);

module.exports = router;
