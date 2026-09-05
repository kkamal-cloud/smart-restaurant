const express = require('express');
const router = express.Router();
const { getKitchenOrders, updateOrderStatus } = require('../controllers/kitchenController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.get('/orders', authenticate, authorize('admin', 'kitchen', 'waiter'), getKitchenOrders);
router.patch('/orders/:id/status', authenticate, authorize('admin', 'kitchen', 'waiter'), updateOrderStatus);

module.exports = router;
