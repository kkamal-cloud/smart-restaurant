const express = require('express');
const router = express.Router();
const { processPayment, getPayments } = require('../controllers/paymentController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.post('/', authenticate, authorize('admin', 'waiter'), processPayment);
router.get('/', authenticate, authorize('admin'), getPayments);

module.exports = router;
