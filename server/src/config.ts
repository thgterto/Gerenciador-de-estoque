
import path from 'path';

const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'inventory_ledger.db');
const logPath = process.env.LOG_PATH || path.resolve(process.cwd(), 'logs', 'audit.log');

// SECURITY FIX: Require JWT_SECRET in production. Only fallback for dev.
const jwtSecret = process.env.JWT_SECRET ||
  (process.env.NODE_ENV !== 'production' ? 'supersecret_change_me_in_prod' : '');

if (!jwtSecret) {
  throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable is missing in production!');
}

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  host: process.env.HOST || '127.0.0.1',
  jwtSecret,
  dbPath,
  logPath,
  logDir: path.dirname(logPath),
};
