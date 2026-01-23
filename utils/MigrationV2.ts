
import { db } from '../db';
import { InventoryItem, CatalogProduct, InventoryBatch, StockBalance, StockMovement } from '../types';
import { generateInventoryId, generateHash } from '../utils/stringUtils';

/**
 * Migration Utility
 * Promotes V1 "Flat" Data to V2 "Relational" Ledger.
 * Should be run once on startup.
 */
export const MigrationV2 = {

    async runMigration() {
        // CHANGED: Removed the strict check that aborted if ANY batch existed.
        // Instead, we will inspect the items to see if they are missing V2 links.

        console.log("[Migration] Checking for V1 -> V2 Promotion candidates...");

        // Fetch all items that might need migration.
        // Optimization: In a huge DB, we might want to filter by !catalogId or !batchId if indexed.
        // For now, iterating all is safer to catch partial migrations.
        const items = await db.items.toArray();
        const pendingItems = items.filter(i => !i.batchId || !i.catalogId);

        if (pendingItems.length === 0) {
            console.log("[Migration] All items appear to be migrated. Skipping.");
            return;
        }

        console.log(`[Migration] Found ${pendingItems.length} legacy items to promote.`);
        let migratedCount = 0;

        // Use a transaction for safety (or chunk it if too large)
        // For local IndexedDB, chunking is better to avoid locking UI too long

        await db.transaction('rw', [
            db.rawDb.items,
            db.rawDb.catalog,
            db.rawDb.batches,
            db.rawDb.balances,
            db.rawDb.stock_movements,
            db.rawDb.storage_locations
        ], async () => {

            for (const item of pendingItems) {
                try {
                    await this._promoteItem(item);
                    migratedCount++;
                } catch (e) {
                    console.error(`[Migration] Failed to migrate item ${item.id}:`, e);
                }
            }
        });

        console.log(`[Migration] Completed. Promoted ${migratedCount} items.`);
    },

    async _promoteItem(item: InventoryItem) {
        const now = new Date().toISOString();

        // 1. Resolve IDs (Generate if missing)
        const catalogId = item.catalogId || `CAT-${generateHash(item.sapCode + item.name)}`;
        const batchId = item.batchId || `BAT-${item.id}`;
        // Basic location hash based on warehouse string
        const locName = item.location?.warehouse || 'Geral';
        const locationId = item.locationId || `LOC-${generateHash(locName)}`;

        // 2. Create/Update Catalog (Master Data)
        // We use put to ensure idempotency (last win)
        const catalog: CatalogProduct = {
            id: catalogId,
            sapCode: item.sapCode,
            name: item.name,
            categoryId: item.category,
            baseUnit: item.baseUnit,
            casNumber: item.casNumber,
            molecularFormula: item.molecularFormula,
            molecularWeight: item.molecularWeight,
            risks: item.risks || { O: false, T: false, T_PLUS: false, C: false, E: false, N: false, Xn: false, Xi: false, F: false, F_PLUS: false },
            isControlled: item.isControlled || false,
            minStockLevel: item.minStockLevel || 0,
            isActive: item.itemStatus !== 'Obsoleto',
            itemType: item.itemType || 'REAGENT',
            glassMaterial: item.glassMaterial,
            glassVolume: item.glassVolume,
            application: item.application
        };
        await db.rawDb.catalog.put(catalog);

        // 3. Create/Update Batch (Lot Data)
        const batch: InventoryBatch = {
            id: batchId,
            catalogId: catalogId,
            lotNumber: item.lotNumber,
            expiryDate: item.expiryDate,
            partnerId: undefined, // Lost in V1, would need partner mapping
            status: 'ACTIVE', // Simplification
            unitCost: item.unitCost || 0,
            currency: item.currency || 'BRL',
            createdAt: item.dateAcquired || now
        };
        await db.rawDb.batches.put(batch);

        // 4. Create Location (If missing)
        const existingLoc = await db.rawDb.storage_locations.get(locationId);
        if (!existingLoc) {
            await db.rawDb.storage_locations.add({
                id: locationId,
                name: locName,
                type: 'WAREHOUSE',
                pathString: `${item.location?.cabinet || ''} ${item.location?.shelf || ''}`.trim()
            });
        }

        // 5. Create Balance (Initial Stock)
        if (item.quantity > 0) {
            const balanceId = `BAL-${generateHash(batchId + locationId)}`;

            // Only add if not exists to avoid overwriting newer data if re-run
            const existingBal = await db.rawDb.balances.get(balanceId);
            if (!existingBal) {
                const balance: StockBalance = {
                    id: balanceId,
                    batchId: batchId,
                    locationId: locationId,
                    quantity: item.quantity,
                    lastMovementAt: item.lastUpdated || now
                };
                await db.rawDb.balances.add(balance);

                // 6. Create Initial Movement (Audit Trail)
                const movement: StockMovement = {
                    id: crypto.randomUUID(),
                    batchId: batchId,
                    type: 'ENTRADA',
                    quantity: item.quantity,
                    toLocationId: locationId,
                    createdAt: item.lastUpdated || now,
                    observation: 'Migração Automática V1->V2',
                    userId: 'SYSTEM'
                };
                await db.rawDb.stock_movements.add(movement);
            }
        }

        // 7. Link Back (Update V1 Item with new FKs)
        if (!item.catalogId || !item.batchId) {
            await db.items.update(item.id, {
                catalogId,
                batchId,
                locationId
            });
        }
    }
};
