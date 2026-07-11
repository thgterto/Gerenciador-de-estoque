import path from 'path';

const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'inventory_ledger.db');
const logPath = process.env.LOG_PATH || path.resolve(process.cwd(), 'logs', 'audit.log');

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is missing.');
}

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  host: process.env.HOST || '127.0.0.1',
  jwtSecret: process.env.JWT_SECRET,
  dbPath,
  logPath,
  logDir: path.dirname(logPath),
};
