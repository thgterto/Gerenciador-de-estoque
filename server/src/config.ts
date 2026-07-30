import path from 'path';

const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'inventory_ledger.db');
const logPath = process.env.LOG_PATH || path.resolve(process.cwd(), 'logs', 'audit.log');
const jwtSecret = process.env.JWT_SECRET || 'supersecret_change_me_in_prod';

// SECURITY: Prevent hardcoded weak secret from being used in production
if (process.env.NODE_ENV === 'production' && jwtSecret === 'supersecret_change_me_in_prod') {
  throw new Error('CRITICAL SECURITY VULNERABILITY: JWT_SECRET environment variable must be set securely in production!');
}

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  host: process.env.HOST || '127.0.0.1',
  jwtSecret,
  dbPath,
  logPath,
  logDir: path.dirname(logPath),
};
