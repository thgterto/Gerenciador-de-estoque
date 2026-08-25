
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

  async getInventory(req: FastifyRequest, res: FastifyReply) {
    // Legacy support: if no query, maybe return old format?
    // But we are adding a new endpoint for full DB.
    // So this remains as V1 legacy.
    const inventory = await this.getInventoryUseCase.execute();
    res.send(inventory);
  }

  async logTransaction(req: FastifyRequest, res: FastifyReply) {
    const transaction = req.body as any;
    await this.logTransactionUseCase.execute(transaction);
    res.status(201).send({ success: true });
  }

  async saveProduct(req: FastifyRequest, res: FastifyReply) {
    const product = req.body as any;
    await this.saveProductUseCase.execute(product);
    res.status(201).send({ success: true });
  }

  // V2 Endpoints

  async getFullDatabase(req: FastifyRequest, res: FastifyReply) {
    const data = await this.getFullDatabaseUseCase.execute();
    res.send(data);
  }

  async syncData(req: FastifyRequest, res: FastifyReply) {
    const payload = req.body as any;
    await this.syncDataUseCase.execute(payload);
    res.send({ success: true, syncedAt: new Date().toISOString() });
  }
}
