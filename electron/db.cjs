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

function getDenormalizedInventory() {
    // Join Catalog + Batches + Balances
    // V1 view expects: id, batchId, catalogId, name, sapCode, ...
    const stmt = db.prepare(`
        SELECT
            b.id AS id, -- Balance ID is the Item ID in V1
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
            b.locationId, -- Need to parse this if it's JSON, but it's likely string in V1
            b.lastMovementAt AS lastUpdated
        FROM balances b
        JOIN batches bat ON b.batchId = bat.id
        JOIN catalog c ON bat.catalogId = c.id
        WHERE b.status != 'DELETED'
    `);

    const rows = stmt.all();

    // Transform location string to object if needed, and parse risks
    return rows.map(row => ({
        ...row,
        risks: safeJsonParse(row.risks),
        location: { warehouse: row.locationId, cabinet: '', shelf: '', position: '' } // Simplified mapping
    }));
}

function safeJsonParse(str) {
    try { return JSON.parse(str); } catch (e) { return {}; }
}

function upsertItem(item) {
    // Transactional upsert
    const upsertTx = db.transaction((item) => {
        // 1. Derive IDs
        let catalogId = item.catalogId;
        if (!catalogId) {
             // Heuristic from GAS: Try to derive from Item ID (Balance ID)
             // e.g. SAP123-LOT456 -> SAP123
             const parts = (item.id || '').split('-');
             if (parts.length > 1) {
                 catalogId = `CAT-${parts.slice(0, parts.length - 1).join('-')}`;
             } else {
                 catalogId = `CAT-${item.id}`;
             }
        }

        const batchId = item.batchId || `BAT-${item.id}`;
        const balanceId = item.id || `BAL-${crypto.randomUUID()}`; // Use item.id as balance ID (V1 convention)

        // 2. Upsert Catalog
        db.prepare(`
            INSERT INTO catalog (id, name, sapCode, casNumber, baseUnit, categoryId, risks, updatedAt)
            VALUES (@id, @name, @sapCode, @casNumber, @baseUnit, @categoryId, @risks, @updatedAt)
            ON CONFLICT(id) DO UPDATE SET
                name=excluded.name,
                sapCode=excluded.sapCode,
                casNumber=excluded.casNumber,
                baseUnit=excluded.baseUnit,
                categoryId=excluded.categoryId,
                risks=excluded.risks,
                updatedAt=excluded.updatedAt
        `).run({
            id: catalogId,
            name: item.name,
            sapCode: item.sapCode,
            casNumber: item.casNumber,
            baseUnit: item.baseUnit,
            categoryId: item.category,
            risks: JSON.stringify(item.risks || {}),
            updatedAt: new Date().toISOString()
        });

        // 3. Upsert Batch
        db.prepare(`
            INSERT INTO batches (id, catalogId, lotNumber, expiryDate, status, updatedAt)
            VALUES (@id, @catalogId, @lotNumber, @expiryDate, @status, @updatedAt)
            ON CONFLICT(id) DO UPDATE SET
                lotNumber=excluded.lotNumber,
                expiryDate=excluded.expiryDate,
                status=excluded.status,
                updatedAt=excluded.updatedAt
        `).run({
            id: batchId,
            catalogId: catalogId,
            lotNumber: item.lotNumber,
            expiryDate: item.expiryDate,
            status: item.itemStatus === 'Ativo' ? 'ACTIVE' : 'BLOCKED',
            updatedAt: new Date().toISOString()
        });

        // 4. Upsert Balance
        db.prepare(`
            INSERT INTO balances (id, batchId, locationId, quantity, lastMovementAt, status)
            VALUES (@id, @batchId, @locationId, @quantity, @lastMovementAt, 'ACTIVE')
            ON CONFLICT(id) DO UPDATE SET
                quantity=excluded.quantity,
                locationId=excluded.locationId,
                lastMovementAt=excluded.lastMovementAt,
                status='ACTIVE'
        `).run({
            id: balanceId,
            batchId: batchId,
            locationId: item.location ? item.location.warehouse : '', // Simplified
            quantity: item.quantity,
            lastMovementAt: new Date().toISOString()
        });
    });

    upsertTx(item);
    return { success: true };
}

function deleteItem(id) {
    // Soft delete balance
    const info = db.prepare(`UPDATE balances SET status = 'DELETED' WHERE id = ?`).run(id);
    return { success: info.changes > 0 };
}

function logMovement(record) {
    if (!record) return { success: false };

    db.prepare(`
        INSERT INTO movements (id, itemId, type, quantity, date, userId, observation, productName, sapCode, lot, unit)
        VALUES (@id, @itemId, @type, @quantity, @date, @userId, @observation, @productName, @sapCode, @lot, @unit)
    `).run({
        id: record.id || crypto.randomUUID(),
        itemId: record.itemId,
        type: record.type,
        quantity: record.quantity,
        date: record.date || new Date().toISOString(),
        userId: record.userId || 'Sistema',
        observation: record.observation,
        productName: record.productName,
        sapCode: record.sapCode,
        lot: record.lot,
        unit: record.unit
    });

    return { success: true };
}

function readFullDB() {
    // For syncing/backup, return full tables
    return {
        catalog: db.prepare('SELECT * FROM catalog').all(),
        batches: db.prepare('SELECT * FROM batches').all(),
        balances: db.prepare('SELECT * FROM balances WHERE status != "DELETED"').all(),
        view: getDenormalizedInventory()
    };
}

module.exports = {
    initDB,
    upsertItem,
    deleteItem,
    logMovement,
    readFullDB,
    getDenormalizedInventory
};
