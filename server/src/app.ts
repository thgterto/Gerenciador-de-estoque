
import Fastify from 'fastify';
import cors from '@fastify/cors';
import staticFiles from '@fastify/static';
import jwt from '@fastify/jwt';
import path from 'path';
import { InventoryController } from './adapters/controllers/InventoryController';
import { AuthController } from './adapters/controllers/AuthController';
import { migrate } from './infrastructure/database/database';

const app = Fastify({ logger: true });

// Setup Controllers
const inventoryController = new InventoryController();
const authController = new AuthController();

// Register plugins
app.register(cors, {
  origin: '*', // Allow all origins for local tool
});

app.register(jwt, {
  secret: process.env.JWT_SECRET || 'supersecret_change_me_in_prod'
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
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`Server running at http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
