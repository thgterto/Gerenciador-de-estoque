
import { db } from '../db';
import seedDataRaw from '../database/seed_data.json';
import { InventoryItem, MovementRecord, StorageAddress, CatalogProduct, InventoryBatch, StockBalance, StorageLocationEntity, BusinessPartner, StockMovement } from '../types';

const seedData = seedDataRaw as any;

export async function seedDatabase() {
    try {
        const count = await db.catalog.count();
        if (count > 0) {
            console.log('Database already populated. Skipping seed.');
            return;
        }

        console.log('Seeding database...');

        await db.clearData();

        // 1. Populate V2 Tables
        await db.catalog.bulkAdd(seedData.catalog as CatalogProduct[]);
        await db.batches.bulkAdd(seedData.batches as InventoryBatch[]);
        await db.partners.bulkAdd(seedData.partners as BusinessPartner[]);
        await db.storage_locations.bulkAdd(seedData.storage_locations as StorageLocationEntity[]);
        await db.stock_movements.bulkAdd(seedData.stock_movements as StockMovement[]);
        await db.balances.bulkAdd(seedData.balances as StockBalance[]);

        // 2. Populate Legacy V1 Tables (for UI Compatibility)
        const items: InventoryItem[] = [];
        const history: MovementRecord[] = [];

        // Helper maps
        const catalogMap = new Map((seedData.catalog as CatalogProduct[]).map((c: any) => [c.id, c]));
        const batchMap = new Map((seedData.batches as InventoryBatch[]).map((b: any) => [b.id, b]));
        const locMap = new Map((seedData.storage_locations as StorageLocationEntity[]).map((l: any) => [l.id, l]));
        const partnerMap = new Map((seedData.partners as BusinessPartner[]).map((p: any) => [p.id, p]));

        // Generate Items from Balances
        for (const bal of (seedData.balances as StockBalance[])) {
            const batch = batchMap.get(bal.batchId);
            const catalog = catalogMap.get(batch?.catalogId || '');
            const location = locMap.get(bal.locationId);
            const partner = partnerMap.get(batch?.partnerId || '');

            if (!batch || !catalog || !location) continue;

            // Parse Location Path to StorageAddress
            // "Name > Cabinet > Floor > Position"
            const parts = (location.pathString || location.name).split(' > ');
            const storageAddress: StorageAddress = {
                warehouse: parts[0] || 'Unknown',
                cabinet: parts[1] || '',
                shelf: parts[2] || '', // Floor mapped to shelf
                position: parts[3] || ''
            };

            const item: InventoryItem = {
                id: bal.id, // Use Balance ID as Item ID

                // Keys
                catalogId: catalog.id,
                batchId: batch.id,
                locationId: location.id,

                // Catalog Props
                sapCode: catalog.sapCode,
                name: catalog.name,
                itemType: catalog.itemType || 'REAGENT',
                category: catalog.categoryId,
                baseUnit: catalog.baseUnit,
                minStockLevel: catalog.minStockLevel,
                risks: catalog.risks,
                casNumber: catalog.casNumber,
                molecularFormula: catalog.molecularFormula,
                molecularWeight: catalog.molecularWeight,
                isControlled: catalog.isControlled,
                type: 'ROH', // Default
                materialGroup: '', // Default

                // Batch Props
                lotNumber: batch.lotNumber,
                expiryDate: batch.expiryDate || '',
                dateAcquired: batch.createdAt || new Date().toISOString(),
                unitCost: batch.unitCost,
                currency: batch.currency || 'BRL',
                itemStatus: (batch.status === 'ACTIVE' ? 'Ativo' : batch.status) as any,
                supplier: partner?.name || '',

                // Balance Props
                quantity: bal.quantity,
                location: storageAddress,
                lastUpdated: bal.updatedAt || new Date().toISOString(),

                // Audit
                createdAt: bal.createdAt,
                updatedAt: bal.updatedAt
            };
            items.push(item);
        }

        await db.items.bulkAdd(items);

        // Generate History
        for (const mov of (seedData.stock_movements as StockMovement[])) {
            const batch = batchMap.get(mov.batchId);
            const catalog = catalogMap.get(batch?.catalogId || '');

            if (!batch || !catalog) continue;

            const record: MovementRecord = {
                id: mov.id,
                itemId: '', // Not strictly linked to a balance ID

                batchId: mov.batchId,
                fromLocationId: mov.fromLocationId,
                toLocationId: mov.toLocationId,

                date: mov.createdAt,
                type: mov.type,

                productName: catalog.name,
                sapCode: catalog.sapCode,
                lot: batch.lotNumber,
                quantity: mov.quantity,
                unit: catalog.baseUnit,

                userId: mov.userId,
                observation: mov.observation
            };
            history.push(record);
        }

        await db.history.bulkAdd(history);

        console.log('Database seeded successfully!');
        console.log(`- ${items.length} items created`);
        console.log(`- ${history.length} history records created`);

        // Force UI update by reloading
        window.location.reload();

    } catch (error) {
        console.error('Failed to seed database:', error);
    }
}
