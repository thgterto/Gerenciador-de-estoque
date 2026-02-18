import { db } from '../db';
import { InventoryItem, StockBalance } from '../types';

export const InventoryAuditService = {
  // Audits consistency between V1 (UI) and V2 (Ledger)
  async runLedgerAudit(fix: boolean = false) {
      let matches = 0;
      let mismatches = 0;
      let corrections = 0;

      // Map: BatchID -> Total Quantity from V2 Balances
      const ledgerSums = new Map<string, number>();

      // Stream Balances (V2) - Memory Efficient
      await db.rawDb.balances.each((bal: StockBalance) => {
          const current = ledgerSums.get(bal.batchId) || 0;
          ledgerSums.set(bal.batchId, current + bal.quantity);
      });

      const updates: InventoryItem[] = [];

      // Stream Items (V1) and Compare
      await db.rawDb.items.each((item: InventoryItem) => {
          const batchId = item.batchId || `BAT-${item.id}`;
          const ledgerQty = ledgerSums.get(batchId);

          if (ledgerQty !== undefined) {
              // Floating point tolerance
              if (Math.abs(ledgerQty - item.quantity) > 0.001) {
                  mismatches++;
                  if (fix) {
                      updates.push({ ...item, quantity: parseFloat(ledgerQty.toFixed(3)) });
                      corrections++;
                  }
              } else {
                  matches++;
              }
          } else {
               // Item exists in V1 but no balance in V2 (Drift)
               if (item.quantity > 0) {
                   mismatches++;
                   if (fix) {
                       updates.push({ ...item, quantity: 0 });
                       corrections++;
                   }
               }
          }
      });

      if (fix && updates.length > 0) {
          await db.items.bulkPut(updates);
      }

      return { matches, mismatches, corrections };
  }
};
