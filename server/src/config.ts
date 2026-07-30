import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'inventory_ledger.db');
const logPath = process.env.LOG_PATH || path.resolve(process.cwd(), 'logs', 'audit.log');
const dataDir = path.dirname(dbPath);

let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  const secretFile = path.join(dataDir, '.jwt_secret');
  if (fs.existsSync(secretFile)) {
    jwtSecret = fs.readFileSync(secretFile, 'utf8').trim();
  } else {
    // SECURITY: Auto-generate a secure random JWT secret if not provided to prevent token forgery
    jwtSecret = crypto.randomBytes(32).toString('hex');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(secretFile, jwtSecret, { mode: 0o600 });
  }
}

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  host: process.env.HOST || '127.0.0.1',
  jwtSecret: jwtSecret,
  dbPath,
  logPath,
  logDir: path.dirname(logPath),
};