import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'inventory_ledger.db');
const logPath = process.env.LOG_PATH || path.resolve(process.cwd(), 'logs', 'audit.log');
const dataDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
    try {
        fs.mkdirSync(dataDir, { recursive: true });
    } catch (e) {
        console.warn("Failed to create data directory:", e);
    }
}

// Secure JWT Secret Loading
let jwtSecret = process.env.JWT_SECRET;
const secretPath = path.join(dataDir, '.jwt_secret');

if (!jwtSecret) {
    if (fs.existsSync(secretPath)) {
        try {
            jwtSecret = fs.readFileSync(secretPath, 'utf-8').trim();
        } catch (e) {
            console.warn("Failed to read JWT secret file:", e);
        }
    }

    if (!jwtSecret) {
        // Generate new secure secret
        jwtSecret = crypto.randomBytes(64).toString('hex');
        try {
            fs.writeFileSync(secretPath, jwtSecret, { mode: 0o600 }); // Secure permissions
        } catch (e) {
            console.warn("Could not save JWT secret to disk. Using ephemeral secret.", e);
        }
    }
}

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  jwtSecret,
  dbPath,
  logPath,
  logDir: path.dirname(logPath),
};
