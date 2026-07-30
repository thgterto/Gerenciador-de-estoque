import { FastifyRequest, FastifyReply } from 'fastify';
import { GetInventory } from '../../use-cases/GetInventory';
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

  // 🛡️ SECURITY NOTE:
  // We omit try/catch blocks here to allow Fastify's centralized errorHandler
  // to safely process exceptions and avoid leaking sensitive error details
  // (like stack traces or internal DB messages) to the client.

  async getInventory(req: FastifyRequest, res: FastifyReply) {
    // Legacy support: if no query, maybe return old format?
    // But we are adding a new endpoint for full DB.
    // So this remains as V1 legacy.
    const inventory = await this.getInventoryUseCase.execute();
    return res.send(inventory);
  }

  async logTransaction(req: FastifyRequest, res: FastifyReply) {
    const transaction = req.body as any;
    await this.logTransactionUseCase.execute(transaction);
    return res.status(201).send({ success: true });
  }

  async saveProduct(req: FastifyRequest, res: FastifyReply) {
    const product = req.body as any;
    await this.saveProductUseCase.execute(product);
    return res.status(201).send({ success: true });
  }

  // V2 Endpoints

  async getFullDatabase(req: FastifyRequest, res: FastifyReply) {
    const data = await this.getFullDatabaseUseCase.execute();
    return res.send(data);
  }

  async syncData(req: FastifyRequest, res: FastifyReply) {
    const payload = req.body as any;
    await this.syncDataUseCase.execute(payload);
    return res.send({ success: true, syncedAt: new Date().toISOString() });
  }
}
