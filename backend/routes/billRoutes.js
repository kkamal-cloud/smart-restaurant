const express = require('express');
const router = express.Router();
const { generateBill, getBillBySession, getBills, finishDining } = require('../controllers/billController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.post('/', authenticate, authorize('admin', 'waiter'), generateBill);
router.post('/finish-dining', authenticate, finishDining);
router.get('/session/:sessionId', authenticate, getBillBySession);
router.get('/', authenticate, authorize('admin', 'waiter'), getBills);

module.exports = router;

