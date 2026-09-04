
import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { GetInventory } from '../../use-cases/GetInventory';
import { TransactionType } from '../../domain/entities/InventoryTransaction';
import { LogTransaction } from '../../use-cases/LogTransaction';
import { SaveProduct } from '../../use-cases/SaveProduct';
import { GetFullDatabase } from '../../use-cases/GetFullDatabase';
import { SyncData } from '../../use-cases/SyncData';

export class InventoryController {
  constructor(
    private getInventoryUseCase: GetInventory,
    private logTransactionUseCase: LogTransaction,
    private saveProductUseCase: SaveProduct,
    private getFullDatabaseUseCase: GetFullDatabase,
    private syncDataUseCase: SyncData
  ) {}

  async getInventory(req: FastifyRequest, res: FastifyReply) {
    try {
      // Legacy support: if no query, maybe return old format?
      // But we are adding a new endpoint for full DB.
      // So this remains as V1 legacy.
      const inventory = await this.getInventoryUseCase.execute();
      res.send(inventory);
    } catch (error: any) {
      res.status(500).send({ error: error.message });
    }
  }

  async logTransaction(req: FastifyRequest, res: FastifyReply) {
    try {
      const logTransactionSchema = z.object({
        productId: z.string().min(1),
        type: z.nativeEnum(TransactionType),
        qty: z.number(),
        user: z.string().min(1)
      });
      const transaction = logTransactionSchema.parse(req.body);
      await this.logTransactionUseCase.execute(transaction);
      res.status(201).send({ success: true });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      res.status(500).send({ error: error.message });
    }
  }

  async saveProduct(req: FastifyRequest, res: FastifyReply) {
    try {
      const saveProductSchema = z.object({
        sku: z.string().min(1),
        name: z.string().min(1),
        min_stock: z.number().min(0),
        safety_stock: z.number().min(0)
      });
      const product = saveProductSchema.parse(req.body);
      await this.saveProductUseCase.execute(product);
      res.status(201).send({ success: true });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      res.status(500).send({ error: error.message });
    }
  }

  // V2 Endpoints

  async getFullDatabase(req: FastifyRequest, res: FastifyReply) {
    try {
      const data = await this.getFullDatabaseUseCase.execute();
      res.send(data);
    } catch (error: any) {
      res.status(500).send({ error: error.message });
    }
  }

  async syncData(req: FastifyRequest, res: FastifyReply) {
    try {
      const payload = req.body as any;
      await this.syncDataUseCase.execute(payload);
      res.send({ success: true, syncedAt: new Date().toISOString() });
    } catch (error: any) {
      res.status(500).send({ error: error.message });
    }
  }
}
