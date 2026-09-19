const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secure_fake_info_detector_jwt_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Check if email already exists
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = crypto.randomUUID ? crypto.randomUUID() : 'user_' + Date.now();

    await db.run(
      'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [userId, name.trim(), email.trim().toLowerCase(), passwordHash, 'user']
    );

    const token = jwt.sign(
      { id: userId, email: email.trim().toLowerCase(), name: name.trim() },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(201).json({
      message: 'Registration successful.',
      token,
      user: { id: userId, name: name.trim(), email: email.trim().toLowerCase() }
    });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    return res.status(500).json({ error: 'Failed to complete registration.' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await db.get('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      message: 'Login successful.',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    return res.status(500).json({ error: 'Failed to process login.' });
  }
}

async function getProfile(req, res) {
  try {
    const user = await db.get('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const scans = await db.all('SELECT id, prediction, modality FROM verifications WHERE user_id = ?', [req.user.id]);
    const stats = {
      total_scans: scans.length,
      fake_scans: scans.filter(s => s.prediction === 'fake').length,
      real_scans: scans.filter(s => s.prediction === 'real').length,
      suspicious_scans: scans.filter(s => s.prediction === 'suspicious').length
    };

    return res.json({ user, stats });
  } catch (err) {
    console.error('[Auth] Profile error:', err);
    return res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await db.get('SELECT id, name, email FROM users WHERE email = ?', [cleanEmail]);
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    // Generate secure 6-digit numeric reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetId = crypto.randomUUID ? crypto.randomUUID() : 'rst_' + Date.now();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    await db.run(
      'INSERT INTO password_resets (id, email, code, expires_at) VALUES (?, ?, ?, ?)',
      [resetId, cleanEmail, resetCode, expiresAt]
    );

    console.log(`\n===================================================`);
    console.log(`[PASSWORD RESET] Code for ${cleanEmail}: [ ${resetCode} ] (Valid for 15 minutes)`);
    console.log(`===================================================\n`);

    return res.json({
      message: 'Password reset code generated. Use the 6-digit verification code to reset your password.',
      email: cleanEmail,
      expires_in_minutes: 15,
      dev_code: resetCode
    });
  } catch (err) {
    console.error('[Auth] Forgot password error:', err);
    return res.status(500).json({ error: 'Failed to process password reset request.' });
  }
}

async function verifyResetCode(req, res) {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    const resetRecord = await db.get(
      'SELECT * FROM password_resets WHERE email = ? AND code = ?',
      [cleanEmail, cleanCode]
    );

    if (!resetRecord || resetRecord.used) {
      return res.status(400).json({ error: 'Invalid or expired verification code.' });
    }

    if (new Date(resetRecord.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

    return res.json({ valid: true, message: 'Verification code is valid.' });
  } catch (err) {
    console.error('[Auth] Verify reset code error:', err);
    return res.status(500).json({ error: 'Failed to verify reset code.' });
  }
}

async function resetPassword(req, res) {
  try {
    const { email, code, new_password } = req.body;
    if (!email || !code || !new_password) {
      return res.status(400).json({ error: 'Email, verification code, and new password are required.' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    const resetRecord = await db.get(
      'SELECT * FROM password_resets WHERE email = ? AND code = ?',
      [cleanEmail, cleanCode]
    );

    if (!resetRecord || resetRecord.used) {
      return res.status(400).json({ error: 'Invalid or already used verification code.' });
    }

    if (new Date(resetRecord.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

    // Hash new password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(new_password, salt);

    // Update password in users table
    await db.run('UPDATE users SET password_hash = ? WHERE email = ?', [newHash, cleanEmail]);

    // Mark reset code as used
    await db.run('UPDATE password_resets SET used = 1 WHERE email = ? AND code = ?', [cleanEmail, cleanCode]);

    return res.json({
      message: 'Password reset successful! You can now log in with your new password.'
    });
  } catch (err) {
    console.error('[Auth] Reset password error:', err);
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
}

module.exports = {
  register,
  login,
  getProfile,
  forgotPassword,
  verifyResetCode,
  resetPassword
};
