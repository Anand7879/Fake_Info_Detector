const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { authenticateToken } = require('../middleware/auth');
const {
  verifyText,
  verifyUrl,
  verifyImage,
  verifyVideo,
  verifyDocument
} = require('../controllers/verifyController');

// All verification routes strictly require authentication
router.post('/text', authenticateToken, verifyText);
router.post('/url', authenticateToken, verifyUrl);
router.post('/image', authenticateToken, upload.single('file'), verifyImage);
router.post('/video', authenticateToken, upload.single('file'), verifyVideo);
router.post('/document', authenticateToken, upload.single('file'), verifyDocument);

module.exports = router;
