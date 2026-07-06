import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'inventory_ledger.db');
const logPath = process.env.LOG_PATH || path.resolve(process.cwd(), 'logs', 'audit.log');

// SECURITY FIX: Generate a random JWT secret instead of using a hardcoded one if not provided in env.
// Persist it to a file so sessions survive server restarts.
let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  const dataDir = path.dirname(dbPath);
  const secretFile = path.join(dataDir, '.jwt_secret');

  if (fs.existsSync(secretFile)) {
    jwtSecret = fs.readFileSync(secretFile, 'utf8');
  } else {
    // Generate a new 256-bit secret
    jwtSecret = crypto.randomBytes(32).toString('hex');

    // Ensure directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Save it for future runs
    fs.writeFileSync(secretFile, jwtSecret, 'utf8');
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
