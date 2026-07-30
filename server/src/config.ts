
import path from 'path';
import crypto from 'crypto';

const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'inventory_ledger.db');
const logPath = process.env.LOG_PATH || path.resolve(process.cwd(), 'logs', 'audit.log');

// SECURITY: Use a random secret by default instead of a hardcoded weak string.
// This ensures that even if developers forget to set the environment variable,
// the server won't use a widely-known compromised secret for signing JWT tokens.
// The downside is that all users will be logged out when the server restarts
// because the secret changes. This encourages explicitly setting JWT_SECRET in production.
const defaultSecret = crypto.randomBytes(32).toString('hex');
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ WARNING (SECURITY): JWT_SECRET environment variable is not set. A random secret was generated. User sessions will not survive server restarts. Please set JWT_SECRET in production to prevent unexpected logouts.');
}

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  host: process.env.HOST || '127.0.0.1',
  jwtSecret: process.env.JWT_SECRET || defaultSecret,
  dbPath,
  logPath,
  logDir: path.dirname(logPath),
};
