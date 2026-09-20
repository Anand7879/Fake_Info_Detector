const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { optionalAuth } = require('../middleware/auth');
const {
  verifyText,
  verifyUrl,
  verifyImage,
  verifyVideo,
  verifyDocument
} = require('../controllers/verifyController');

// All verification routes support both authenticated users and guests
router.post('/text', optionalAuth, verifyText);
router.post('/url', optionalAuth, verifyUrl);
router.post('/image', optionalAuth, upload.single('file'), verifyImage);
router.post('/video', optionalAuth, upload.single('file'), verifyVideo);
router.post('/document', optionalAuth, upload.single('file'), verifyDocument);

module.exports = router;
