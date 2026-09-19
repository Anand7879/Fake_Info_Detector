const db = require('../config/db');

async function getHistory(req, res) {
  try {
    const userId = req.user ? req.user.id : null;
    let query = 'SELECT * FROM verifications';
    const params = [];

    if (userId) {
      query += ' WHERE user_id = ?';
      params.push(userId);
    }

    query += ' ORDER BY created_at DESC';

    const records = await db.all(query, params);

    // Parse serialized JSON columns
    const formatted = records.map(r => ({
      ...r,
      explanation: typeof r.explanation_json === 'string' ? JSON.parse(r.explanation_json) : r.explanation_json,
      indicators: typeof r.indicators_json === 'string' ? JSON.parse(r.indicators_json) : r.indicators_json
    }));

    return res.json({ count: formatted.length, verifications: formatted });
  } catch (err) {
    console.error('[History] Get history error:', err);
    return res.status(500).json({ error: 'Failed to retrieve scan history.' });
  }
}

async function getVerificationById(req, res) {
  try {
    const { id } = req.params;
    const record = await db.get('SELECT * FROM verifications WHERE id = ?', [id]);
    if (!record) {
      return res.status(404).json({ error: 'Verification report not found.' });
    }

    const formatted = {
      ...record,
      explanation: typeof record.explanation_json === 'string' ? JSON.parse(record.explanation_json) : record.explanation_json,
      indicators: typeof record.indicators_json === 'string' ? JSON.parse(record.indicators_json) : record.indicators_json
    };

    return res.json(formatted);
  } catch (err) {
    console.error('[History] Get single report error:', err);
    return res.status(500).json({ error: 'Failed to fetch verification report.' });
  }
}

async function deleteVerification(req, res) {
  try {
    const { id } = req.params;
    const info = await db.run('DELETE FROM verifications WHERE id = ?', [id]);
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Record not found or already deleted.' });
    }
    return res.json({ message: 'Verification record deleted successfully.' });
  } catch (err) {
    console.error('[History] Delete record error:', err);
    return res.status(500).json({ error: 'Failed to delete record.' });
  }
}

async function deleteMultipleVerifications(req, res) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required.' });
    }
    const placeholders = ids.map(() => '?').join(',');
    const info = await db.run(`DELETE FROM verifications WHERE id IN (${placeholders})`, ids);
    return res.json({
      message: `${info.changes} verification record(s) deleted successfully.`,
      deletedCount: info.changes
    });
  } catch (err) {
    console.error('[History] Batch delete error:', err);
    return res.status(500).json({ error: 'Failed to batch delete records.' });
  }
}


async function getDashboardStats(req, res) {
  try {
    const userId = req.user ? req.user.id : null;
    let query = 'SELECT modality, prediction, confidence_score, created_at FROM verifications';
    const params = [];
    if (userId) {
      query += ' WHERE user_id = ?';
      params.push(userId);
    }
    query += ' ORDER BY created_at DESC';

    const records = await db.all(query, params);

    const totalScans = records.length;
    const fakeCount = records.filter(r => r.prediction === 'fake').length;
    const realCount = records.filter(r => r.prediction === 'real').length;
    const suspiciousCount = records.filter(r => r.prediction === 'suspicious').length;

    const modalityDistribution = {
      text: records.filter(r => r.modality === 'text').length,
      image: records.filter(r => r.modality === 'image').length,
      video: records.filter(r => r.modality === 'video').length,
      url: records.filter(r => r.modality === 'url').length,
      document: records.filter(r => r.modality === 'document').length
    };

    const recentScans = records.slice(0, 5);

    return res.json({
      totalScans,
      fakeCount,
      realCount,
      suspiciousCount,
      modalityDistribution,
      recentScans
    });
  } catch (err) {
    console.error('[History] Dashboard stats error:', err);
    return res.status(500).json({ error: 'Failed to compute dashboard analytics.' });
  }
}

module.exports = {
  getHistory,
  getVerificationById,
  deleteVerification,
  deleteMultipleVerifications,
  getDashboardStats
};

