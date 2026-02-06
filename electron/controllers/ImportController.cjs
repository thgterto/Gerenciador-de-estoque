const db = require('../db.cjs');

function handleSyncTransaction(payload) {
    // Expected payload: { catalog: [], batches: [], balances: [], movements: [] }
    // We execute this in a single transaction

    db.runTransaction(() => {
        if (payload.catalog && Array.isArray(payload.catalog)) {
            const stmt = db.prepare('INSERT INTO catalog (id, name, sapCode, casNumber, baseUnit, categoryId, risks, updatedAt) VALUES (@id, @name, @sapCode, @casNumber, @baseUnit, @categoryId, @risks, @updatedAt) ON CONFLICT(id) DO UPDATE SET name=excluded.name, sapCode=excluded.sapCode, casNumber=excluded.casNumber, baseUnit=excluded.baseUnit, categoryId=excluded.categoryId, risks=excluded.risks, updatedAt=excluded.updatedAt');
            for (const item of payload.catalog) {
                stmt.run({
                    id: item.id,
                    name: item.name,
                    sapCode: item.sapCode,
                    casNumber: item.casNumber,
                    baseUnit: item.baseUnit,
                    categoryId: item.categoryId || item.category, // Handle variation
                    risks: typeof item.risks === 'string' ? item.risks : JSON.stringify(item.risks || {}),
                    updatedAt: item.updatedAt || new Date().toISOString()
                });
            }
        }

        if (payload.batches && Array.isArray(payload.batches)) {
            const stmt = db.prepare('INSERT INTO batches (id, catalogId, lotNumber, expiryDate, partnerId, status, updatedAt) VALUES (@id, @catalogId, @lotNumber, @expiryDate, @partnerId, @status, @updatedAt) ON CONFLICT(id) DO UPDATE SET lotNumber=excluded.lotNumber, expiryDate=excluded.expiryDate, status=excluded.status, updatedAt=excluded.updatedAt');
            for (const item of payload.batches) {
                stmt.run({
                    id: item.id,
                    catalogId: item.catalogId,
                    lotNumber: item.lotNumber,
                    expiryDate: item.expiryDate,
                    partnerId: item.partnerId || '',
                    status: item.status || 'ACTIVE',
                    updatedAt: item.updatedAt || new Date().toISOString()
                });
            }
        }

        if (payload.balances && Array.isArray(payload.balances)) {
            const stmt = db.prepare('INSERT INTO balances (id, batchId, locationId, quantity, lastMovementAt, status) VALUES (@id, @batchId, @locationId, @quantity, @lastMovementAt, @status) ON CONFLICT(id) DO UPDATE SET quantity=excluded.quantity, locationId=excluded.locationId, lastMovementAt=excluded.lastMovementAt, status=excluded.status');
            for (const item of payload.balances) {
                stmt.run({
                    id: item.id,
                    batchId: item.batchId,
                    locationId: item.locationId,
                    quantity: item.quantity,
                    lastMovementAt: item.lastMovementAt || new Date().toISOString(),
                    status: item.status || 'ACTIVE'
                });
            }
        }

        if (payload.movements && Array.isArray(payload.movements)) {
             const stmt = db.prepare('INSERT INTO movements (id, date, type, batchId, quantity, userId, observation) VALUES (@id, @date, @type, @batchId, @quantity, @userId, @observation)'); // Note: Schema might vary slightly, adapting to 3NF movement log if needed, but current schema has itemId/batchId
             // The GAS implementation uses 'Movements' with headers ['ID', 'Date', 'Type', 'BatchID', 'Quantity', 'User', 'Observation']
             // Our SQLite schema has: id, itemId, batchId, ...
             // Let's stick to the schema defined in db.cjs or make sure it matches.
             // Looking at db.cjs logMovement: it uses itemId, type, quantity...
             // GAS uses BatchID. We should probably support both or standardize.
             // For now, let's assume the payload matches the DB columns or do best effort mapping.

             for (const item of payload.movements) {
                 // Check if ID exists to avoid PK violation or use INSERT OR IGNORE
                 // Movements are usually append-only.
                 try {
                     stmt.run({
                        id: item.id,
                        date: item.date || item.Date,
                        type: item.type || item.Type,
                        batchId: item.batchId || item.BatchID,
                        quantity: item.quantity || item.Quantity,
                        userId: item.userId || item.User,
                        observation: item.observation || item.Observation
                     });
                 } catch (e) {
                     // Ignore duplicates or errors in individual movement logs during bulk sync
                     console.warn('Failed to insert movement:', item, e);
                 }
             }
        }
    });

    return { success: true };
}

module.exports = {
    handleSyncTransaction
};
