const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getHistory,
  getVerificationById,
  deleteVerification,
  deleteMultipleVerifications,
  getDashboardStats
} = require('../controllers/historyController');

router.get('/', authenticateToken, getHistory);
router.get('/stats', authenticateToken, getDashboardStats);
router.post('/batch-delete', authenticateToken, deleteMultipleVerifications);
router.get('/:id', authenticateToken, getVerificationById);
router.delete('/:id', authenticateToken, deleteVerification);


module.exports = router;
