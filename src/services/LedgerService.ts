
import { db } from '../db';
import { StockMovement, StockBalance } from '../types';
import { generateHash } from '../utils/stringUtils';

interface RegisterMovementDTO {
    batchId: string;
    type: 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'TRANSFERENCIA';
    quantity: number;
    fromLocationId?: string;
    toLocationId?: string;
    userId?: string;
    observation?: string;
    date?: string; // Optional override for migration/backfill
}

/**
 * LEDGER SERVICE (V2 Core)
 * Responsible for the "Real" Inventory State.
 * Implements strict ACID properties via Dexie Transactions.
 */
export const LedgerService = {

    /**
     * The "Trigger" implementation.
     * Records a movement and updates balances atomically.
     */
    async registerMovement(dto: RegisterMovementDTO): Promise<StockMovement> {
        const { batchId, type, quantity, fromLocationId, toLocationId, userId, observation, date } = dto;

        if (quantity <= 0) throw new Error("Ledger: Quantity must be positive.");

        const movement: StockMovement = {
            id: crypto.randomUUID(),
            batchId,
            type,
            quantity,
            fromLocationId,
            toLocationId,
            userId,
            observation,
            createdAt: date || new Date().toISOString()
        };

        try {
            // ATOMIC TRANSACTION: Movements + Balances
            await db.transaction('rw', [db.rawDb.stock_movements, db.rawDb.balances], async () => {

                // 1. Insert Movement (The Fact)
                await db.rawDb.stock_movements.add(movement);

                // 2. Update Balances (The State) - mimicking "apply_stock_movement" trigger
                if (type === 'ENTRADA') {
                    if (!toLocationId) throw new Error("Entrada requires toLocationId");
                    await this._incrementBalance(batchId, toLocationId, quantity);
                }
                else if (type === 'SAIDA') {
                    if (!fromLocationId) throw new Error("Saida requires fromLocationId");
                    await this._decrementBalance(batchId, fromLocationId, quantity);
                }
                else if (type === 'TRANSFERENCIA') {
                    if (!fromLocationId || !toLocationId) throw new Error("Transferencia requires both locations");
                    await this._decrementBalance(batchId, fromLocationId, quantity);
                    await this._incrementBalance(batchId, toLocationId, quantity);
                }
                else if (type === 'AJUSTE') {
                    // Adjust is absolute or relative? Usually absolute in UI, but here we treat as a delta from the caller.
                    // However, standard Ledger usually treats "Ajuste" as a delta input.
                    // If the input 'quantity' is the DELTA, we just apply it.
                    // If it's absolute, the caller must calculate delta.
                    // Assumption: DTO contains the DELTA quantity.

                    // Logic: If 'fromLocation' is provided, we deduct. If 'toLocation' is provided, we add.
                    // If both, it's a transfer. If neither... error.
                    // Standard Convention:
                    // POSITIVE ADJUST (Gain) -> toLocationId
                    // NEGATIVE ADJUST (Loss) -> fromLocationId

                    if (toLocationId) {
                        await this._incrementBalance(batchId, toLocationId, quantity);
                    } else if (fromLocationId) {
                        await this._decrementBalance(batchId, fromLocationId, quantity);
                    } else {
                        throw new Error("Ajuste requires at least one location");
                    }
                }
            });

            return movement;

        } catch (error) {
            console.error("Ledger Transaction Failed:", error);
            throw error; // Rollback occurs automatically in Dexie
        }
    },

    /**
     * Internal helper to Increment Balance (Upsert)
     */
    async _incrementBalance(batchId: string, locationId: string, qty: number) {
        // Find existing balance by compound index
        const existing = await db.rawDb.balances.where({ batchId, locationId }).first();

        if (existing) {
            await db.rawDb.balances.update(existing.id, {
                quantity: existing.quantity + qty,
                lastMovementAt: new Date().toISOString()
            });
        } else {
            // Create new balance
            const newBalance: StockBalance = {
                id: `BAL-${generateHash(batchId + locationId)}`,
                batchId,
                locationId,
                quantity: qty,
                lastMovementAt: new Date().toISOString()
            };
            await db.rawDb.balances.add(newBalance);
        }
    },

    /**
     * Internal helper to Decrement Balance
     */
    async _decrementBalance(batchId: string, locationId: string, qty: number) {
         const existing = await db.rawDb.balances.where({ batchId, locationId }).first();

         if (!existing) {
             throw new Error(`Saldo insuficiente (Registro inexistente) para Lote ${batchId} no Local ${locationId}`);
         }

         const newQty = existing.quantity - qty;

         // Constraint Check: No Negative Stock
         if (newQty < 0) {
             throw new Error(`Saldo insuficiente. Atual: ${existing.quantity}, Tentativa: -${qty}`);
         }

         await db.rawDb.balances.update(existing.id, {
             quantity: newQty,
             lastMovementAt: new Date().toISOString()
         });
    }
};
