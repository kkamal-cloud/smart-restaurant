const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getCategories, createCategory, updateCategory, getFoods, getFoodById, createFood, updateFood, deleteFood, uploadImage } = require('../controllers/menuController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

router.route('/categories')
  .get(getCategories) // Public/Admin depends on controller logic
  .post(authenticate, authorize('admin'), createCategory);

router.route('/categories/:id')
  .put(authenticate, authorize('admin'), updateCategory);

router.route('/foods')
  .get(getFoods)
  .post(authenticate, authorize('admin'), createFood);

router.route('/foods/:id')
  .get(getFoodById)
  .put(authenticate, authorize('admin'), updateFood)
  .delete(authenticate, authorize('admin'), deleteFood);

router.post('/foods/:id/image', authenticate, authorize('admin'), upload.single('image'), uploadImage);

module.exports = router;
