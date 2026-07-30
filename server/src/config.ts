import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'inventory_ledger.db');
const logPath = process.env.LOG_PATH || path.resolve(process.cwd(), 'logs', 'audit.log');
const dataDir = path.dirname(dbPath);

// SECURITY: Use environment variable or a locally persisted random secret to avoid hardcoded secrets.
let jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  const secretPath = path.join(dataDir, '.jwt_secret');
  if (fs.existsSync(secretPath)) {
    jwtSecret = fs.readFileSync(secretPath, 'utf8').trim();
  } else {
    // Generate a strong random secret
    jwtSecret = crypto.randomBytes(32).toString('hex');

    // Ensure directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Save for future runs so sessions remain valid across restarts
    fs.writeFileSync(secretPath, jwtSecret, { mode: 0o600 });
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
