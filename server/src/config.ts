import path from 'path';
import crypto from 'crypto';

const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'inventory_ledger.db');
const logPath = process.env.LOG_PATH || path.resolve(process.cwd(), 'logs', 'audit.log');

const defaultSecret = crypto.randomBytes(32).toString('hex');
const jwtSecret = process.env.JWT_SECRET || defaultSecret;

if (!process.env.JWT_SECRET) {
  // Only log if not in test environment to avoid spamming test logs
  if (process.env.NODE_ENV !== 'test') {
    console.warn('⚠️  SECURITY WARNING: Using randomly generated JWT secret. Sessions will not persist across restarts.');
    console.warn('   Set JWT_SECRET environment variable to fix this.');
  }
}

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT || '3000') : 3000,
  jwtSecret,
  dbPath,
  logPath,
  logDir: path.dirname(logPath),
};
