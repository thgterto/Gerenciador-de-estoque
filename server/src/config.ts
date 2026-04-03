
import path from 'path';

const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'inventory_ledger.db');
const logPath = process.env.LOG_PATH || path.resolve(process.cwd(), 'logs', 'audit.log');

import crypto from 'crypto';

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  host: process.env.HOST || '127.0.0.1',
  // SECURITY: Generate a secure random fallback secret to prevent hardcoded JWT vulnerability
  jwtSecret: process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex'),
  dbPath,
  logPath,
  logDir: path.dirname(logPath),
};
