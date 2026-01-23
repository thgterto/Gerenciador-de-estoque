
import { db } from '../db';
import { InventoryItem, StorageAddress, StockBalance } from '../types';

/**
 * SNAPSHOT SERVICE (V1 Updater)
 * Responsible for maintaining the "UI View" (items table)
 * consistent with the Ledger (stock_movements + balances).
 *
 * Acts like the "Worker" described in the architecture plan.
 */
export const SnapshotService = {

    /**
     * Rebuilds the V1 Snapshot for a specific Batch.
     * This corresponds to the "Worker" processing items from the sync_queue.
     */
    async updateItemSnapshot(batchId: string): Promise<void> {
        try {
            // 1. Fetch Source Data from V2 (Ledger)
            const batch = await db.rawDb.batches.get(batchId);
            if (!batch) {
                console.warn(`SnapshotService: Batch ${batchId} not found.`);
                return;
            }

            const catalog = await db.rawDb.catalog.get(batch.catalogId);
            if (!catalog) {
                console.warn(`SnapshotService: Catalog ${batch.catalogId} not found.`);
                return;
            }

            // Get all balances for this batch (distributed across locations)
            const balances: StockBalance[] = await db.rawDb.balances.where('batchId').equals(batchId).toArray();

            // 2. Aggregate Total Quantity
            const totalQuantity = balances.reduce((sum: number, bal: StockBalance) => sum + bal.quantity, 0);

            // 3. Determine Primary Location (Heuristic for V1 Flat View)
            // The UI expects a single location. We pick the one with the most stock, or the first one.
            let primaryLocation: StorageAddress = {
                warehouse: 'Indefinido',
                cabinet: '',
                shelf: '',
                position: ''
            };

            let primaryLocationId = '';

            if (balances.length > 0) {
                // Sort by quantity desc to find "Main" location
                balances.sort((a: StockBalance, b: StockBalance) => b.quantity - a.quantity);
                primaryLocationId = balances[0].locationId;

                const locEntity = await db.rawDb.storage_locations.get(primaryLocationId);
                if (locEntity) {
                    // Parse pathString or name into legacy StorageAddress
                    // Assumption: Name/Path is formatted or mapped.
                    // Ideally we should have a utility to parse this.
                    primaryLocation = {
                        warehouse: locEntity.name, // Simplified mapping
                        cabinet: '',
                        shelf: '',
                        position: locEntity.pathString || ''
                    };
                }
            }

            // 4. Construct V1 Item Object
            // The ID of the V1 item is trickier.
            // In the legacy system, Item ID often equaled Batch ID or a hash.
            // We need to find if there is an existing item linked to this batch.

            const existingItem = await db.rawDb.items.where('batchId').equals(batchId).first();
            const itemId = existingItem ? existingItem.id : batchId; // Fallback to Batch ID if new

            const now = new Date().toISOString();

            const snapshot: InventoryItem = {
                id: itemId,

                // Links
                batchId: batch.id,
                catalogId: catalog.id,
                locationId: primaryLocationId,

                // Catalog Data
                name: catalog.name,
                sapCode: catalog.sapCode,
                category: catalog.categoryId, // Mapping 'categoryId' to 'category' field name
                baseUnit: catalog.baseUnit,
                minStockLevel: catalog.minStockLevel,
                risks: catalog.risks,
                casNumber: catalog.casNumber,
                molecularFormula: catalog.molecularFormula,
                molecularWeight: catalog.molecularWeight,
                isControlled: catalog.isControlled,
                itemType: catalog.itemType,
                glassMaterial: catalog.glassMaterial,
                glassVolume: catalog.glassVolume,
                application: catalog.application,

                // Batch Data
                lotNumber: batch.lotNumber,
                expiryDate: batch.expiryDate || '',
                dateAcquired: batch.manufactureDate || batch.createdAt || now,
                unitCost: batch.unitCost,
                currency: batch.currency || 'BRL',
                itemStatus: batch.status === 'ACTIVE' ? 'Ativo' :
                           batch.status === 'BLOCKED' ? 'Bloqueado' :
                           batch.status === 'QUARANTINE' ? 'Quarentena' : 'Obsoleto',
                supplier: batch.partnerId || '', // Needs partner lookup ideally

                // Calculated Data
                quantity: totalQuantity,
                location: primaryLocation,
                lastUpdated: now,

                // Static Defaults
                type: 'ROH', // Default for now
                materialGroup: 'Geral',
            };

            // 5. Write to V1 Table (Async Update)
            await db.items.put(snapshot);
            // console.log(`[Snapshot] Updated Item ${itemId} from Batch ${batchId}. Qty: ${totalQuantity}`);

        } catch (error) {
            console.error(`[Snapshot] Failed to update batch ${batchId}:`, error);
        }
    }
};
