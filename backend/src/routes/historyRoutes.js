const express = require('express');
const router = express.Router();
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const {
  getHistory,
  getVerificationById,
  deleteVerification,
  deleteMultipleVerifications,
  getDashboardStats
} = require('../controllers/historyController');

router.get('/', optionalAuth, getHistory);
router.get('/stats', optionalAuth, getDashboardStats);
router.post('/batch-delete', authenticateToken, deleteMultipleVerifications);
router.get('/:id', optionalAuth, getVerificationById);
router.delete('/:id', authenticateToken, deleteVerification);


module.exports = router;
