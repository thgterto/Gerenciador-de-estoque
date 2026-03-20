
import path from 'path';
import crypto from 'crypto';

const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'inventory_ledger.db');
const logPath = process.env.LOG_PATH || path.resolve(process.cwd(), 'logs', 'audit.log');

// Generate a secure random fallback to avoid hardcoded secrets
const fallbackSecret = crypto.randomBytes(64).toString('hex');

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  host: process.env.HOST || '127.0.0.1',
  jwtSecret: process.env.JWT_SECRET || fallbackSecret,
  dbPath,
  logPath,
  logDir: path.dirname(logPath),
};
