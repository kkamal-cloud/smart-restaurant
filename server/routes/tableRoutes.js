const express = require('express');
const router = express.Router();
const { getTables, createTable, updateTable, generateQr, getQrDetails } = require('../controllers/tableController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.route('/tables')
  .get(authenticate, authorize('admin', 'waiter'), getTables)
  .post(authenticate, authorize('admin'), createTable);

router.route('/tables/:id')
  .put(authenticate, authorize('admin'), updateTable);

router.post('/qr/generate/:tableId', authenticate, authorize('admin'), generateQr);
router.get('/qr/:token', getQrDetails);

module.exports = router;
