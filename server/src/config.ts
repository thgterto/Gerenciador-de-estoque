
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'inventory_ledger.db');
const logPath = process.env.LOG_PATH || path.resolve(process.cwd(), 'logs', 'audit.log');
const logDir = path.dirname(logPath);

const dataDir = path.dirname(dbPath);
const secretPath = path.join(dataDir, '.jwt_secret');

let jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  if (fs.existsSync(secretPath)) {
    jwtSecret = fs.readFileSync(secretPath, 'utf8').trim();
  } else {
    // SECURITY: Generate a secure random secret instead of using a hardcoded default
    jwtSecret = crypto.randomBytes(32).toString('hex');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    // Store it so sessions persist across restarts
    fs.writeFileSync(secretPath, jwtSecret, { mode: 0o600 });
  }
}

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  host: process.env.HOST || '127.0.0.1',
  jwtSecret,
  dbPath,
  logPath,
  logDir,
};
