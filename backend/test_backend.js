/**
 * Standalone integration test script for the Express Backend API.
 * Tests: Registration, Login, Token validation, Scan submission, History log, and Dashboard stats.
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runBackendTests() {
  console.log('===================================================');
  console.log('Starting Fake Info Detector Backend Test Suite...');
  console.log('===================================================\n');

  try {
    // 1. Health Check
    console.log('[1/6] Testing Backend Health Check...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('>> Health Status:', health.data);

    // 2. User Registration
    const testEmail = `researcher_${Date.now()}@example.com`;
    console.log(`\n[2/6] Registering new test user: ${testEmail}...`);
    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Dr. Jane Doe',
      email: testEmail,
      password: 'SecurePassword123!'
    });
    console.log('>> Registered successfully:', regRes.data.user);
    const token = regRes.data.token;

    // 3. Authenticated Profile Fetch
    console.log('\n[3/6] Fetching profile with JWT token...');
    const profileRes = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('>> Profile retrieved:', profileRes.data.user);

    // 4. Submit a Text Verification Scan through the Backend
    console.log('\n[4/6] Submitting a Text Scan via Backend Proxy...');
    const scanPayload = {
      text: "According to a study published in Nature Medicine and Reuters, moderate exercise reduces heart disease."
    };
    const scanRes = await axios.post(`${BASE_URL}/verify/text`, scanPayload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('>> Scan Result Saved (ID: ' + scanRes.data.id + '):');
    console.log('   - Modality:   ', scanRes.data.modality);
    console.log('   - Verdict:    ', scanRes.data.prediction.toUpperCase());
    console.log('   - Confidence: ', scanRes.data.confidence_score + '%');
    const scanId = scanRes.data.id;

    // 5. Query Verification History & Single Item Details
    console.log('\n[5/6] Querying Verification History...');
    const histRes = await axios.get(`${BASE_URL}/history`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`>> Found ${histRes.data.count} scan record(s) in database.`);
    
    const singleRes = await axios.get(`${BASE_URL}/history/${scanId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('>> Single verification report fetched successfully for ID:', singleRes.data.id);

    // 6. Query Dashboard Stats
    console.log('\n[6/6] Querying Analytics Dashboard Statistics...');
    const statsRes = await axios.get(`${BASE_URL}/history/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('>> Dashboard Analytics:', JSON.stringify(statsRes.data, null, 2));

    console.log('\n===================================================');
    console.log('ALL BACKEND INTEGRATION TESTS PASSED SUCCESSFULLY!');
    console.log('===================================================');
  } catch (err) {
    console.error('\n[TEST FAILED]', err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

runBackendTests();
