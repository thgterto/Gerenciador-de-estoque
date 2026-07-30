
import path from 'path';

const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'inventory_ledger.db');
const logPath = process.env.LOG_PATH || path.resolve(process.cwd(), 'logs', 'audit.log');

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  // SECURITY FIX: Enforce JWT_SECRET configuration instead of using a weak hardcoded default
  console.error('FATAL ERROR: JWT_SECRET environment variable is not set.');
  process.exit(1);
}

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  host: process.env.HOST || '127.0.0.1',
  jwtSecret,
  dbPath,
  logPath,
  logDir: path.dirname(logPath),
};
