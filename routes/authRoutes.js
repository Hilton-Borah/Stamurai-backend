const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  allUser,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', getMe);
router.get('/all', allUser);

module.exports = router;
