const express = require('express');
const router = express.Router();
const { createOrJoinSession, getSessionDetails, joinSessionWithToken, closeSession, getSessions } = require('../controllers/sessionController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.post('/', createOrJoinSession);
router.get('/', authenticate, authorize('admin', 'waiter'), getSessions);
<<<<<<< HEAD
router.get('/:id', authenticate, getSessionDetails); // Requires session token in header
=======
router.get('/:id', getSessionDetails);
>>>>>>> 137886e9e2ab69827772f95310f4e215a0be8995
router.post('/:id/join', authenticate, joinSessionWithToken); // Requires session token
router.patch('/:id/close', authenticate, authorize('admin', 'waiter'), closeSession);

module.exports = router;
