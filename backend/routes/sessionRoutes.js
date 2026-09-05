const express = require('express');
const router = express.Router();
const { createOrJoinSession, getSessionDetails, joinSessionWithToken, closeSession, getSessions } = require('../controllers/sessionController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.post('/', createOrJoinSession);
router.get('/', authenticate, authorize('admin', 'waiter'), getSessions);
router.get('/:id', getSessionDetails);
router.post('/:id/join', authenticate, joinSessionWithToken); // Requires session token
router.patch('/:id/close', authenticate, authorize('admin', 'waiter'), closeSession);

module.exports = router;
