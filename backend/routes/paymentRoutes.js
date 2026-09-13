const express = require('express');
const router = express.Router();
const { processPayment, getPayments, createRazorpayOrder, verifyRazorpayPayment } = require('../controllers/paymentController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.post('/', authenticate, authorize('admin', 'waiter'), processPayment);
router.get('/', authenticate, authorize('admin'), getPayments);
router.post('/razorpay/create-order', authenticate, authorize('admin', 'waiter'), createRazorpayOrder);
router.post('/razorpay/verify', authenticate, authorize('admin', 'waiter'), verifyRazorpayPayment);

module.exports = router;
