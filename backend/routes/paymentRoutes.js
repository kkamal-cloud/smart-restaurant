const express = require('express');
const router = express.Router();
const { processPayment, getPayments, createRazorpayOrder, verifyRazorpayPayment, selectCounterPayment } = require('../controllers/paymentController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.post('/', authenticate, authorize('admin', 'waiter'), processPayment);
router.post('/select-counter-method', authenticate, selectCounterPayment);
router.get('/', authenticate, authorize('admin'), getPayments);
router.post('/razorpay/create-order', authenticate, createRazorpayOrder);
router.post('/razorpay/verify', authenticate, verifyRazorpayPayment);

module.exports = router;

