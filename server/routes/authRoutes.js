const express = require('express');
const router = express.Router();
const { login, getUsers, createUser, updateUser } = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.post('/login', login);

router.route('/users')
  .get(authenticate, authorize('admin'), getUsers)
  .post(authenticate, authorize('admin'), createUser);

router.route('/users/:id')
  .put(authenticate, authorize('admin'), updateUser);

module.exports = router;
