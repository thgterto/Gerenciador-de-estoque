import crypto from 'crypto';

import path from 'path';

const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'inventory_ledger.db');
const logPath = process.env.LOG_PATH || path.resolve(process.cwd(), 'logs', 'audit.log');

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  host: process.env.HOST || '127.0.0.1',
  jwtSecret: process.env.JWT_SECRET || (() => {
    console.warn('WARNING: JWT_SECRET not set, using dynamically generated secret for this session. Tokens will not persist across restarts.');
    return crypto.randomBytes(32).toString('hex');
  })(),
  dbPath,
  logPath,
  logDir: path.dirname(logPath),
};
