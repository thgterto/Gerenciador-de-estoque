
import path from 'path';
import crypto from 'crypto';

const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'inventory_ledger.db');
const logPath = process.env.LOG_PATH || path.resolve(process.cwd(), 'logs', 'audit.log');

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  host: process.env.HOST || '127.0.0.1',
  // SECURITY FIX: Fallback to secure random 32-byte secret instead of a hardcoded string
  jwtSecret: process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex'),
  dbPath,
  logPath,
  logDir: path.dirname(logPath),
};
