
import path from 'path';

const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'inventory_ledger.db');
const logPath = process.env.LOG_PATH || path.resolve(process.cwd(), 'logs', 'audit.log');

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  jwtSecret: process.env.JWT_SECRET || 'supersecret_change_me_in_prod',
  dbPath,
  logPath,
  logDir: path.dirname(logPath),
};
