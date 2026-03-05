import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'inventory_ledger.db');
const logPath = process.env.LOG_PATH || path.resolve(process.cwd(), 'logs', 'audit.log');
const dataDir = path.dirname(dbPath);

// 🛡️ SENTINEL: SECURITY FIX - Prevent hardcoded JWT secrets
// Generate a persistent, secure random JWT secret if not provided via environment variables.
// This prevents attackers from forging tokens if they extract the default hardcoded secret from the source/binary.
let jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  const secretPath = path.join(dataDir, '.jwt_secret');
  if (fs.existsSync(secretPath)) {
    jwtSecret = fs.readFileSync(secretPath, 'utf8').trim();
  } else {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    jwtSecret = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(secretPath, jwtSecret, 'utf8');
  }
}

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  host: process.env.HOST || '127.0.0.1',
  jwtSecret,
  dbPath,
  logPath,
  logDir: path.dirname(logPath),
};
