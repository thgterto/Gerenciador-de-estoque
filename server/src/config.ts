
import path from 'path';

const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'inventory_ledger.db');
const logPath = process.env.LOG_PATH || path.resolve(process.cwd(), 'logs', 'audit.log');

// SECURITY: Ensure JWT_SECRET is explicitly provided in production to avoid hardcoded secrets.
const jwtSecret = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'dev_secret_do_not_use_in_prod' : undefined);

if (!jwtSecret && process.env.NODE_ENV === 'production') {
  throw new Error('FATAL ERROR: JWT_SECRET environment variable must be set in production to secure sessions properly.');
}

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  host: process.env.HOST || '127.0.0.1',
  jwtSecret: jwtSecret as string,
  dbPath,
  logPath,
  logDir: path.dirname(logPath),
};
