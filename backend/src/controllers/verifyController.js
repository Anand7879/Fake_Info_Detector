const crypto = require('crypto');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const db = require('../config/db');

let rawAiUrl = (process.env.AI_ENGINE_URL || 'http://localhost:8000').trim();
if (rawAiUrl && !rawAiUrl.startsWith('http://') && !rawAiUrl.startsWith('https://')) {
  rawAiUrl = 'http://' + rawAiUrl;
}
const AI_ENGINE_URL = rawAiUrl;

async function saveVerificationRecord({
  userId, modality, inputSummary, result, filePath = null
}) {
  const recordId = crypto.randomUUID ? crypto.randomUUID() : 'scan_' + Date.now();
  const weights = result.weights || {};
  
  const insertSql = `INSERT INTO verifications (
    id, user_id, modality, input_summary, prediction,
    confidence_score, model_score, rule_score, composite_score,
    explanation_json, indicators_json, file_path
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const getParams = (targetUserId) => [
    recordId,
    targetUserId,
    (inputSummary || '').substring(0, 500),
    result.prediction,
    result.confidence_score,
    weights.model_probability !== undefined ? weights.model_probability : null,
    weights.rule_score !== undefined ? weights.rule_score : null,
    weights.composite_score !== undefined ? weights.composite_score : null,
    JSON.stringify(result.explanation || []),
    JSON.stringify(result.indicators || {}),
    filePath
  ];

  try {
    await db.run(insertSql, getParams(userId || null));
  } catch (dbErr) {
    // If foreign key constraint fails (e.g. legacy token user_id not found in new DB), fallback to null user_id
    if (userId && (dbErr.code === '23503' || String(dbErr.message).includes('foreign key constraint'))) {
      console.warn(`[Verify] Foreign key violation for userId ${userId}. Falling back to anonymous scan record.`);
      try {
        await db.run(insertSql, getParams(null));
      } catch (retryErr) {
        console.error('[Verify] Retry save record failed:', retryErr.message);
      }
    } else {
      console.error('[Verify] Failed to save verification record to DB:', dbErr.message);
    }
  }

  return recordId;
}

async function verifyText(req, res) {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text content is required for verification.' });
    }

    const aiResp = await axios.post(`${AI_ENGINE_URL}/verify/text`, { text }, { timeout: 60000 });
    const result = aiResp.data;

    const recordId = await saveVerificationRecord({
      userId: req.user ? req.user.id : null,
      modality: 'text',
      inputSummary: text.trim(),
      result
    });

    return res.json({ id: recordId, ...result });
  } catch (err) {
    console.error('[Verify] Text error:', err.message);
    const detail = err.response && err.response.data ? err.response.data.detail : err.message;
    return res.status(500).json({ error: 'Text verification service error', detail });
  }
}

async function verifyUrl(req, res) {
  try {
    const { url } = req.body;
    if (!url || !url.trim()) {
      return res.status(400).json({ error: 'URL is required for verification.' });
    }

    const aiResp = await axios.post(`${AI_ENGINE_URL}/verify/url`, { url }, { timeout: 60000 });
    const result = aiResp.data;

    const recordId = await saveVerificationRecord({
      userId: req.user ? req.user.id : null,
      modality: 'url',
      inputSummary: url.trim(),
      result
    });

    return res.json({ id: recordId, ...result });
  } catch (err) {
    console.error('[Verify] URL error:', err.message);
    const detail = err.response && err.response.data ? err.response.data.detail : err.message;
    return res.status(500).json({ error: 'URL verification service error', detail });
  }
}

async function verifyFileModality(req, res, modality) {
  if (!req.file) {
    return res.status(400).json({ error: `No ${modality} file uploaded.` });
  }

  const filePath = req.file.path;

  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath), {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    const aiResp = await axios.post(`${AI_ENGINE_URL}/verify/${modality}`, form, {
      headers: form.getHeaders(),
      maxContentLength: 100 * 1024 * 1024,
      maxBodyLength: 100 * 1024 * 1024,
      timeout: 180000 // 180s (3 min) for video deepfake forensics
    });

    const result = aiResp.data;

    const recordId = await saveVerificationRecord({
      userId: req.user ? req.user.id : null,
      modality,
      inputSummary: req.file.originalname,
      result,
      filePath: req.file.filename
    });

    return res.json({ id: recordId, ...result });
  } catch (err) {
    console.error(`[Verify] ${modality} error:`, err.message);
    const detail = err.response && err.response.data ? err.response.data.detail : err.message;
    return res.status(500).json({ error: `${modality} verification service error`, detail });
  }
}

const verifyImage = (req, res) => verifyFileModality(req, res, 'image');
const verifyVideo = (req, res) => verifyFileModality(req, res, 'video');
const verifyDocument = (req, res) => verifyFileModality(req, res, 'document');

module.exports = {
  verifyText,
  verifyUrl,
  verifyImage,
  verifyVideo,
  verifyDocument
};
