
import Fastify from 'fastify';
import cors from '@fastify/cors';
import staticFiles from '@fastify/static';
import jwt from '@fastify/jwt';
import path from 'path';
import { InventoryController } from './adapters/controllers/InventoryController';
import { AuthController } from './adapters/controllers/AuthController';
import { migrate } from './infrastructure/database/database';
import { errorHandler } from './adapters/ErrorHandler';
import { config } from './config';

// Infrastructure
import { SQLiteInventoryRepository } from './infrastructure/database/SQLiteInventoryRepository';
import { SQLiteUserRepository } from './infrastructure/database/SQLiteUserRepository';
import { FileLogger } from './infrastructure/logging/FileLogger';

// Use Cases - Inventory
import { GetInventory } from './use-cases/GetInventory';
import { LogTransaction } from './use-cases/LogTransaction';
import { SaveProduct } from './use-cases/SaveProduct';

// Use Cases - Auth
import { RegisterUser } from './use-cases/RegisterUser';
import { LoginUser } from './use-cases/LoginUser';

const app = Fastify({ logger: true });

// Register Error Handler
app.setErrorHandler(errorHandler);

// --- COMPOSITION ROOT ---
// 1. Infrastructure
const inventoryRepository = new SQLiteInventoryRepository();
const userRepository = new SQLiteUserRepository();
const logger = new FileLogger();

// 2. Use Cases
const getInventory = new GetInventory(inventoryRepository);
const logTransaction = new LogTransaction(inventoryRepository, logger);
const saveProduct = new SaveProduct(inventoryRepository);
const registerUser = new RegisterUser(userRepository);
const loginUser = new LoginUser(userRepository);

// 3. Controllers
const inventoryController = new InventoryController(getInventory, logTransaction, saveProduct);
const authController = new AuthController(registerUser, loginUser);

// Register plugins
app.register(cors, {
  origin: '*', // Allow all origins for local tool
});

app.register(jwt, {
  secret: config.jwtSecret
});

// Serve Frontend Static Files
// In production (pkg), assets are read from snapshot.
// In dev (node), assets are read from ../dist
const distPath = path.join(__dirname, '../../dist');
app.register(staticFiles, {
  root: distPath,
  prefix: '/', // Serve at root
});

// API Routes - Public
app.get('/api/inventory', (req, res) => inventoryController.getInventory(req, res));
app.post('/api/auth/register', (req, res) => authController.register(req, res));
app.post('/api/auth/login', (req, res) => authController.login(req, res));

// API Routes - Protected
app.post('/api/inventory/transaction', {
  onRequest: [async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  }]
}, (req, res) => inventoryController.logTransaction(req, res));

app.post('/api/inventory/product', {
  onRequest: [async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  }]
}, (req, res) => inventoryController.saveProduct(req, res));

// Fallback for SPA (Single Page Application)
app.setNotFoundHandler((req, res) => {
  if (req.raw.url && req.raw.url.startsWith('/api')) {
    res.status(404).send({ error: 'API route not found' });
  } else {
    res.sendFile('index.html');
  }
});

const start = async () => {
  try {
    // Run migrations
    await migrate();

    // Start server
    const port = config.port;

    // Security: Bind to 127.0.0.1 (localhost) to prevent network exposure.
    // This tool is designed to be used locally.
    await app.listen({ port, host: '127.0.0.1' });

    // Security Warning: Check for default JWT secret
    if (config.jwtSecret === 'supersecret_change_me_in_prod') {
      console.warn('⚠️  WARNING: Using default JWT secret! Set JWT_SECRET environment variable for production safety.');
    }

    console.log(`Server running at http://127.0.0.1:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
