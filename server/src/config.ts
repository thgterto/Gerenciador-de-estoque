
import path from 'path';
import crypto from 'crypto';

const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'inventory_ledger.db');
const logPath = process.env.LOG_PATH || path.resolve(process.cwd(), 'logs', 'audit.log');

// Generate a random secret if one isn't provided. This ensures that even if no config
// is supplied, the app doesn't rely on a hardcoded, guessable secret.
// Note: This will invalidate JWT tokens across server restarts unless JWT_SECRET is explicitly set.
const generateSecret = () => crypto.randomBytes(32).toString('hex');

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  host: process.env.HOST || '127.0.0.1',
  jwtSecret: process.env.JWT_SECRET || generateSecret(),
  dbPath,
  logPath,
  logDir: path.dirname(logPath),
};
