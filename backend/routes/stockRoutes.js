const express = require('express');
const router = express.Router();
const { getStock, getStockAlerts, restock } = require('../controllers/stockController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.get('/', authenticate, authorize('admin', 'kitchen'), getStock);
router.get('/alerts', authenticate, authorize('admin', 'kitchen'), getStockAlerts);
router.post('/restock', authenticate, authorize('admin'), restock);

module.exports = router;
