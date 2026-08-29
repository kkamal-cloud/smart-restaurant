const express = require('express');
const router = express.Router();
const { createOrder, getOrdersBySession, cancelOrder, getOrderById } = require('../controllers/orderController');
const { updateOrderStatus } = require('../controllers/kitchenController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// customer endpoints require session token
router.route('/')
  .post(authenticate, createOrder)
  .get(authenticate, getOrdersBySession);

router.route('/:id')
  .get(authenticate, getOrderById);

router.patch('/:id/cancel', authenticate, cancelOrder);
router.patch('/:id/status', authenticate, authorize('admin', 'kitchen', 'waiter'), updateOrderStatus);

module.exports = router;
