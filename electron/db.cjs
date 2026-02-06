const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

let db;

function initDB(dbPath) {
  try {
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');

    const schemaPath = path.join(__dirname, 'db/schema.sql');
    if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        db.exec(schema);
    } else {
        console.error('Schema file not found at:', schemaPath);
    }

    console.log('Database initialized at:', dbPath);
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return false;
  }
}

// Low-level DB Wrappers
function runTransaction(callback) {
    if (!db) throw new Error("DB not initialized");
    const tx = db.transaction(callback);
    return tx();
}

function prepare(sql) {
    if (!db) throw new Error("DB not initialized");
    return db.prepare(sql);
}

function run(sql, params) {
    if (!db) throw new Error("DB not initialized");
    return db.prepare(sql).run(params);
}

function all(sql, params) {
    if (!db) throw new Error("DB not initialized");
    return db.prepare(sql).all(params);
}

function exec(sql) {
    if (!db) throw new Error("DB not initialized");
    return db.exec(sql);
}

// READ-ONLY VIEWS
function getDenormalizedInventory() {
    const stmt = db.prepare(`
        SELECT
            b.id AS id,
            bat.id AS batchId,
            c.id AS catalogId,
            c.name,
            c.sapCode,
            c.casNumber,
            c.baseUnit,
            c.categoryId AS category,
            c.risks,
            bat.lotNumber,
            bat.expiryDate,
            CASE WHEN bat.status = 'ACTIVE' THEN 'Ativo' ELSE 'Bloqueado' END AS itemStatus,
            b.quantity,
            b.locationId,
            b.lastMovementAt AS lastUpdated
        FROM balances b
        JOIN batches bat ON b.batchId = bat.id
        JOIN catalog c ON bat.catalogId = c.id
        WHERE b.status != 'DELETED'
    `);

    const rows = stmt.all();

    return rows.map(row => ({
        ...row,
        risks: safeJsonParse(row.risks),
        location: { warehouse: row.locationId, cabinet: '', shelf: '', position: '' }
    }));
}

function safeJsonParse(str) {
    try { return JSON.parse(str); } catch (e) { return {}; }
}

function readFullDB() {
    return {
        catalog: db.prepare('SELECT * FROM catalog').all(),
        batches: db.prepare('SELECT * FROM batches').all(),
        balances: db.prepare('SELECT * FROM balances WHERE status != "DELETED"').all(),
        view: getDenormalizedInventory()
    };
}

// System Config & Queue
function getSystemConfig(key) {
    const row = db.prepare('SELECT value FROM systemConfigs WHERE key = ?').get(key);
    return row ? safeJsonParse(row.value) : null;
}

function setSystemConfig(key, value, category = 'General') {
    db.prepare(`
        INSERT INTO systemConfigs (key, value, category, updatedAt)
        VALUES (@key, @value, @category, @updatedAt)
        ON CONFLICT(key) DO UPDATE SET
            value=excluded.value,
            category=excluded.category,
            updatedAt=excluded.updatedAt
    `).run({
        key,
        value: JSON.stringify(value),
        category,
        updatedAt: new Date().toISOString()
    });
}

function processOfflineQueue() {
    // Placeholder for retry logic
    console.log("Processing offline queue (not implemented yet)");
}

module.exports = {
    initDB,
    runTransaction,
    prepare,
    run,
    all,
    exec,
    getDenormalizedInventory,
    readFullDB,
    getSystemConfig,
    setSystemConfig,
    processOfflineQueue
};
