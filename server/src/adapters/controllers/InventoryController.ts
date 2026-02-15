
import { FastifyRequest, FastifyReply } from 'fastify';
import { GetInventory } from '../../use-cases/GetInventory';
import { LogTransaction, LogTransactionRequest } from '../../use-cases/LogTransaction';
import { SaveProduct, SaveProductRequest } from '../../use-cases/SaveProduct';
import { InventoryRepository } from '../../domain/repositories/InventoryRepository';
import { SQLiteInventoryRepository } from '../../infrastructure/database/SQLiteInventoryRepository';
import { z } from 'zod';
import { TransactionType } from '../../domain/entities/InventoryTransaction';
import { FileLogger } from '../../infrastructure/logging/FileLogger';

const logTransactionSchema = z.object({
  productId: z.string().min(1),
  type: z.nativeEnum(TransactionType),
  qty: z.number().int(),
  user: z.string().optional(),
}).refine((data) => {
  if ((data.type === TransactionType.IN || data.type === TransactionType.OUT) && data.qty <= 0) {
    return false;
  }
  return true;
}, {
  message: "Quantity must be positive for IN and OUT transactions",
  path: ["qty"],
});

const saveProductSchema = z.object({
  id: z.string().min(1).optional(),
  sku: z.string().min(1),
  name: z.string().min(1),
  min_stock: z.number().int().nonnegative(),
  safety_stock: z.number().int().nonnegative(),
});

export class InventoryController {
  private repository: InventoryRepository;
  private logger: FileLogger;
  private getInventoryUseCase: GetInventory;
  private logTransactionUseCase: LogTransaction;
  private saveProductUseCase: SaveProduct;

  constructor() {
    this.repository = new SQLiteInventoryRepository();
    this.logger = new FileLogger();
    this.getInventoryUseCase = new GetInventory(this.repository);
    this.logTransactionUseCase = new LogTransaction(this.repository, this.logger);
    this.saveProductUseCase = new SaveProduct(this.repository);
  }

  async getInventory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const inventory = await this.getInventoryUseCase.execute();
      return reply.send(inventory);
    } catch (error) {
      return reply.status(500).send({ error: (error as Error).message });
    }
  }

  async logTransaction(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = logTransactionSchema.parse(request.body);
      const user = (request.user as any)?.username || body.user;

      if (!user) {
        return reply.status(400).send({ error: "User is required" });
      }

      await this.logTransactionUseCase.execute({ ...body, user });
      return reply.status(201).send({ message: 'Transaction logged successfully' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      return reply.status(400).send({ error: (error as Error).message });
    }
  }

  async saveProduct(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = saveProductSchema.parse(request.body);
      await this.saveProductUseCase.execute(body);
      return reply.status(201).send({ message: 'Product saved successfully' });
    } catch (error) {
       if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      return reply.status(400).send({ error: (error as Error).message });
    }
  }
}
