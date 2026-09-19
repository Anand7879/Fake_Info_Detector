const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  forgotPassword,
  verifyResetCode,
  resetPassword
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, getProfile);

// Password recovery endpoints
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);

module.exports = router;
