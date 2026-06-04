
import path from 'path';
import crypto from 'crypto';

const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'inventory_ledger.db');
const logPath = process.env.LOG_PATH || path.resolve(process.cwd(), 'logs', 'audit.log');

// SECURITY: Use a random secret by default if none is provided to prevent predictable token forging
const defaultSecret = crypto.randomBytes(32).toString('hex');

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  host: process.env.HOST || '127.0.0.1',
  jwtSecret: process.env.JWT_SECRET || defaultSecret,
  dbPath,
  logPath,
  logDir: path.dirname(logPath),
};
