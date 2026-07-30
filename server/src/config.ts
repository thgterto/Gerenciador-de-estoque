
import path from 'path';
import crypto from 'crypto';

const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'inventory_ledger.db');
const logPath = process.env.LOG_PATH || path.resolve(process.cwd(), 'logs', 'audit.log');

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  host: process.env.HOST || '127.0.0.1',
  // SECURITY: Generate a strong random fallback if JWT_SECRET is not provided
  // to prevent attackers from using a known default key to forge JWTs.
  jwtSecret: process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex'),
  dbPath,
  logPath,
  logDir: path.dirname(logPath),
};
