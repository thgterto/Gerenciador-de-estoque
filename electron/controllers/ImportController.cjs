const db = require('../db.cjs');
const XLSX = require('xlsx');

function handleSyncTransaction(payload) {
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
                    categoryId: item.categoryId || item.category,
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
             const stmt = db.prepare('INSERT INTO movements (id, date, type, batchId, quantity, userId, observation) VALUES (@id, @date, @type, @batchId, @quantity, @userId, @observation)');
             for (const item of payload.movements) {
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
                     console.warn('Failed to insert movement:', item, e);
                 }
             }
        }
    });

    return { success: true };
}

function processExcelImport(filePath) {
    try {
        console.log(`[ImportController] Processing Excel: ${filePath}`);
        // Read file using XLSX - Ensure we handle large files via streaming if possible,
        // but 'readFile' loads into memory. For now, it's okay for typical files.
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert to JSON (Header: 1 ensures array of arrays for custom parsing, or object array)
        const rawData = XLSX.utils.sheet_to_json(sheet);

        console.log(`[ImportController] Read ${rawData.length} rows`);

        return { success: true, data: rawData, count: rawData.length };
    } catch (error) {
        console.error('[ImportController] Excel processing failed:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    handleSyncTransaction,
    processExcelImport
};
