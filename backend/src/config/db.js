const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const dbUrl = (process.env.DATABASE_URL || '').trim();
const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');

let db = null;
let dbType = 'json_store';

// Helper to convert SQLite/MySQL '?' positional placeholders to PostgreSQL '$1, $2, $3...'
function formatPgSql(sql) {
  let paramIndex = 1;
  return sql.replace(/\?/g, () => `$${paramIndex++}`);
}

// Fallback JSON-backed storage in case database is absent
const JSON_DB_FILE = path.join(__dirname, '..', '..', 'fakeinfo_store.json');

function initJsonStore() {
  if (!fs.existsSync(JSON_DB_FILE)) {
    fs.writeFileSync(JSON_DB_FILE, JSON.stringify({ users: [], verifications: [], password_resets: [] }, null, 2));
  }
}

function readJsonStore() {
  initJsonStore();
  try {
    const data = JSON.parse(fs.readFileSync(JSON_DB_FILE, 'utf-8'));
    if (!data.users) data.users = [];
    if (!data.verifications) data.verifications = [];
    if (!data.password_resets) data.password_resets = [];
    return data;
  } catch (err) {
    return { users: [], verifications: [], password_resets: [] };
  }
}

function writeJsonStore(data) {
  fs.writeFileSync(JSON_DB_FILE, JSON.stringify(data, null, 2));
}

// Database Adapter Interface
const dbAdapter = {
  // Execute a query returning multiple rows
  all: async (sql, params = []) => {
    if (dbType === 'postgres') {
      const pgSql = formatPgSql(sql);
      const res = await db.query(pgSql, params);
      return res.rows || [];
    } else if (dbType === 'better-sqlite3') {
      return db.prepare(sql).all(...params);
    } else if (dbType === 'sqlite3') {
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
      });
    } else {
      // JSON Store fallback
      const store = readJsonStore();
      const lower = sql.toLowerCase();
      if (lower.includes('from users')) {
        return store.users;
      } else if (lower.includes('from verifications')) {
        let results = [...store.verifications];
        if (lower.includes('where user_id =') && params.length > 0) {
          results = results.filter(v => v.user_id === params[0]);
        }
        if (lower.includes('order by created_at desc')) {
          results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
        return results;
      }
      return [];
    }
  },

  // Execute a query returning a single row
  get: async (sql, params = []) => {
    if (dbType === 'postgres') {
      const pgSql = formatPgSql(sql);
      const res = await db.query(pgSql, params);
      return (res.rows && res.rows[0]) ? res.rows[0] : null;
    } else if (dbType === 'better-sqlite3') {
      return db.prepare(sql).get(...params);
    } else if (dbType === 'sqlite3') {
      return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
      });
    } else {
      // JSON Store fallback
      const store = readJsonStore();
      const lower = sql.toLowerCase();
      if (lower.includes('from users')) {
        if (lower.includes('email =') && params.length > 0) {
          return store.users.find(u => u.email.toLowerCase() === params[0].toLowerCase()) || null;
        }
        if (lower.includes('id =') && params.length > 0) {
          return store.users.find(u => u.id === params[0]) || null;
        }
      } else if (lower.includes('from verifications')) {
        if (lower.includes('id =') && params.length > 0) {
          return store.verifications.find(v => v.id === params[0]) || null;
        }
      } else if (lower.includes('from password_resets')) {
        if (lower.includes('email =') && lower.includes('code =') && params.length >= 2) {
          return store.password_resets.find(
            r => r.email.toLowerCase() === params[0].toLowerCase() && r.code === params[1] && r.used === 0
          ) || null;
        }
        if (lower.includes('code =') && params.length > 0) {
          return store.password_resets.find(r => r.code === params[0] && r.used === 0) || null;
        }
      }
      return null;
    }
  },

  // Execute an insert/update/delete
  run: async (sql, params = []) => {
    if (dbType === 'postgres') {
      const pgSql = formatPgSql(sql);
      const res = await db.query(pgSql, params);
      return { changes: res.rowCount, lastID: null };
    } else if (dbType === 'better-sqlite3') {
      const info = db.prepare(sql).run(...params);
      return { changes: info.changes, lastID: info.lastInsertRowid };
    } else if (dbType === 'sqlite3') {
      return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve({ changes: this.changes, lastID: this.lastID });
        });
      });
    } else {
      // JSON Store fallback
      const store = readJsonStore();
      const lower = sql.toLowerCase();
      if (lower.includes('insert into users')) {
        const [id, name, email, password_hash, role] = params;
        const newUser = {
          id, name, email, password_hash,
          role: role || 'user',
          created_at: new Date().toISOString()
        };
        store.users.push(newUser);
        writeJsonStore(store);
        return { changes: 1 };
      } else if (lower.includes('update users set password_hash =')) {
        const [password_hash, email] = params;
        const target = store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (target) {
          target.password_hash = password_hash;
          target.updated_at = new Date().toISOString();
          writeJsonStore(store);
          return { changes: 1 };
        }
        return { changes: 0 };
      } else if (lower.includes('insert into password_resets')) {
        const [id, email, code, expires_at] = params;
        const newReset = {
          id,
          email: email.toLowerCase(),
          code,
          expires_at,
          used: 0,
          created_at: new Date().toISOString()
        };
        store.password_resets.push(newReset);
        writeJsonStore(store);
        return { changes: 1 };
      } else if (lower.includes('update password_resets set used = 1')) {
        if (params.length >= 2) {
          const [email, code] = params;
          const target = store.password_resets.find(
            r => r.email.toLowerCase() === email.toLowerCase() && r.code === code
          );
          if (target) {
            target.used = 1;
            writeJsonStore(store);
            return { changes: 1 };
          }
        } else if (params.length === 1) {
          const target = store.password_resets.find(r => r.id === params[0] || r.code === params[0]);
          if (target) {
            target.used = 1;
            writeJsonStore(store);
            return { changes: 1 };
          }
        }
        return { changes: 0 };
      } else if (lower.includes('insert into verifications')) {
        const [
          id, user_id, modality, input_summary, prediction,
          confidence_score, model_score, rule_score, composite_score,
          explanation_json, indicators_json, file_path
        ] = params;
        const newVerification = {
          id, user_id, modality, input_summary, prediction,
          confidence_score, model_score, rule_score, composite_score,
          explanation_json, indicators_json, file_path,
          created_at: new Date().toISOString()
        };
        store.verifications.push(newVerification);
        writeJsonStore(store);
        return { changes: 1 };
      } else if (lower.includes('delete from verifications')) {
        const initLen = store.verifications.length;
        if (lower.includes('id in') && params.length > 0) {
          const idSet = new Set(params);
          store.verifications = store.verifications.filter(v => !idSet.has(v.id));
          writeJsonStore(store);
          return { changes: initLen - store.verifications.length };
        } else if (lower.includes('id =') && params.length > 0) {
          store.verifications = store.verifications.filter(v => v.id !== params[0]);
          writeJsonStore(store);
          return { changes: initLen - store.verifications.length };
        }
      }

      return { changes: 0 };
    }
  }
};

async function initializeDatabase() {
  if (isPostgres) {
    try {
      const { Pool } = require('pg');
      const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
      db = new Pool({
        connectionString: dbUrl,
        ssl: isLocal ? false : { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000
      });

      // Test connection & apply schema
      const client = await db.connect();
      try {
        console.log('[DB] Connected to PostgreSQL database successfully.');
        const schemaPath = path.join(__dirname, '..', 'models', 'schema.sql');
        if (fs.existsSync(schemaPath)) {
          const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
          await client.query(schemaSql);
          console.log('[DB] PostgreSQL schema initialized & verified (users, verifications, password_resets tables active).');
        }
        dbType = 'postgres';
        return;
      } finally {
        client.release();
      }
    } catch (e) {
      console.error('[DB] PostgreSQL connection failed:', e.message);
      console.warn('[DB] Falling back to SQLite/JSON store...');
    }
  }

  // Try better-sqlite3
  try {
    const Database = require('better-sqlite3');
    const sqlitePath = path.join(__dirname, '..', '..', 'fakeinfo.sqlite');
    db = new Database(sqlitePath);
    dbType = 'better-sqlite3';
    console.log('[DB] Connected to SQLite via better-sqlite3 at:', sqlitePath);

    const schemaPath = path.join(__dirname, '..', 'models', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      db.exec(schemaSql);
    }
    return;
  } catch (e1) {
    // Try sqlite3
    try {
      const sqlite3 = require('sqlite3').verbose();
      const sqlitePath = path.join(__dirname, '..', '..', 'fakeinfo.sqlite');
      db = new sqlite3.Database(sqlitePath);
      dbType = 'sqlite3';
      console.log('[DB] Connected to SQLite via sqlite3 at:', sqlitePath);
      const schemaPath = path.join(__dirname, '..', 'models', 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
        db.exec(schemaSql);
      }
      return;
    } catch (e2) {
      // JSON Store fallback
      dbType = 'json_store';
      initJsonStore();
      console.log('[DB] Operating in resilient local JSON storage mode at:', JSON_DB_FILE);
    }
  }
}

// Kick off database initialization immediately
initializeDatabase().catch(err => {
  console.error('[DB] Fatal error during DB initialization:', err);
});

module.exports = dbAdapter;
