const db = require('../db.cjs');
const crypto = require('crypto');

function upsertItem(item) {
    // Transactional upsert
    // We use db.transaction explicitly here.
    // Since db.cjs exports 'transaction' helper or we need to access the db instance.
    // Let's assume db.cjs exports the raw db instance or a transaction wrapper.
    // We will refactor db.cjs to export 'runTransaction' which takes a function.

    const result = db.runTransaction(() => {
        // 1. Derive IDs
        let catalogId = item.catalogId;
        if (!catalogId) {
             // Heuristic from GAS: Try to derive from Item ID (Balance ID)
             // e.g. SAP123-LOT456 -> SAP123
             const parts = (item.id || '').split('-');
             if (parts.length > 1) {
                 catalogId = 'CAT-' + parts.slice(0, parts.length - 1).join('-');
             } else {
                 catalogId = 'CAT-' + item.id;
             }
        }

        const batchId = item.batchId || 'BAT-' + item.id;
        const balanceId = item.id || 'BAL-' + crypto.randomUUID(); // Use item.id as balance ID (V1 convention)

        // 2. Upsert Catalog
        db.run('INSERT INTO catalog (id, name, sapCode, casNumber, baseUnit, categoryId, risks, updatedAt) VALUES (@id, @name, @sapCode, @casNumber, @baseUnit, @categoryId, @risks, @updatedAt) ON CONFLICT(id) DO UPDATE SET name=excluded.name, sapCode=excluded.sapCode, casNumber=excluded.casNumber, baseUnit=excluded.baseUnit, categoryId=excluded.categoryId, risks=excluded.risks, updatedAt=excluded.updatedAt', {
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
        db.run('INSERT INTO batches (id, catalogId, lotNumber, expiryDate, status, updatedAt) VALUES (@id, @catalogId, @lotNumber, @expiryDate, @status, @updatedAt) ON CONFLICT(id) DO UPDATE SET lotNumber=excluded.lotNumber, expiryDate=excluded.expiryDate, status=excluded.status, updatedAt=excluded.updatedAt', {
            id: batchId,
            catalogId: catalogId,
            lotNumber: item.lotNumber,
            expiryDate: item.expiryDate,
            status: item.itemStatus === 'Ativo' ? 'ACTIVE' : 'BLOCKED',
            updatedAt: new Date().toISOString()
        });

        // 4. Upsert Balance
        db.run('INSERT INTO balances (id, batchId, locationId, quantity, lastMovementAt, status) VALUES (@id, @batchId, @locationId, @quantity, @lastMovementAt, "ACTIVE") ON CONFLICT(id) DO UPDATE SET quantity=excluded.quantity, locationId=excluded.locationId, lastMovementAt=excluded.lastMovementAt, status="ACTIVE"', {
            id: balanceId,
            batchId: batchId,
            locationId: item.location ? item.location.warehouse : '', // Simplified
            quantity: item.quantity,
            lastMovementAt: new Date().toISOString()
        });
    });

    return { success: true };
}

function deleteItem(id) {
    // Soft delete balance
    const info = db.run('UPDATE balances SET status = "DELETED" WHERE id = ?', id);
    return { success: info.changes > 0 };
}

function logMovement(record) {
    if (!record) return { success: false };

    db.run('INSERT INTO movements (id, itemId, type, quantity, date, userId, observation, productName, sapCode, lot, unit) VALUES (@id, @itemId, @type, @quantity, @date, @userId, @observation, @productName, @sapCode, @lot, @unit)', {
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

module.exports = {
    upsertItem,
    deleteItem,
    logMovement
};
