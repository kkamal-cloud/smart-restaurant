const express = require('express');
const router = express.Router();
const { submitFeedback, getFeedback } = require('../controllers/feedbackController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.post('/', authenticate, submitFeedback);
router.get('/', authenticate, authorize('admin'), getFeedback);

module.exports = router;
