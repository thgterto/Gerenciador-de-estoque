
import Fastify from 'fastify';
import cors from '@fastify/cors';
import staticFiles from '@fastify/static';
import path from 'path';
import { InventoryController } from './adapters/controllers/InventoryController';
import { migrate } from './infrastructure/database/database';

const app = Fastify({ logger: true });

// Setup Controller
const inventoryController = new InventoryController();

// Register plugins
app.register(cors, {
  origin: '*', // Allow all origins for local tool
});

// Serve Frontend Static Files
// In production (pkg), assets are read from snapshot.
// In dev (node), assets are read from ../dist
const distPath = path.join(__dirname, '../../dist');
app.register(staticFiles, {
  root: distPath,
  prefix: '/', // Serve at root
});

// API Routes
app.get('/api/inventory', (req, res) => inventoryController.getInventory(req, res));
app.post('/api/inventory/transaction', (req, res) => inventoryController.logTransaction(req, res));
app.post('/api/inventory/product', (req, res) => inventoryController.saveProduct(req, res));

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
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`Server running at http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
