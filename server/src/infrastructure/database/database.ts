
import Database from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
import path from 'path';
import fs from 'fs';

export interface ProductTable {
  id: string;
  sku: string;
  name: string;
  min_stock: number;
  safety_stock: number;
}

export interface InventoryTransactionTable {
  id: string;
  product_id: string;
  type: 'IN' | 'OUT' | 'ADJUST';
  qty: number;
  timestamp: string;
  user: string;
}

export interface DatabaseSchema {
  products: ProductTable;
  inventory_transactions: InventoryTransactionTable;
}

const dbPath = path.resolve(process.cwd(), 'data', 'inventory_ledger.db');

// Ensure data directory exists
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

export const db = new Kysely<DatabaseSchema>({
  dialect: new SqliteDialect({
    database: new Database(dbPath),
  }),
});

// Inline migration script
const INITIAL_SCHEMA = `
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  min_stock INTEGER NOT NULL,
  safety_stock INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  type TEXT CHECK(type IN ('IN', 'OUT', 'ADJUST')) NOT NULL,
  qty INTEGER NOT NULL,
  timestamp TEXT NOT NULL,
  user TEXT NOT NULL,
  FOREIGN KEY(product_id) REFERENCES products(id)
);
`;

// Helper to run migration
export const migrate = async () => {
    const statements = INITIAL_SCHEMA.split(';').filter(stmt => stmt.trim().length > 0);
    const sqlite = new Database(dbPath);
    // Prompt says: "journal_mode: 'DELETE' # Mais seguro para pastas de rede..."
    sqlite.pragma('journal_mode = DELETE');
    sqlite.pragma('synchronous = FULL');

    sqlite.transaction(() => {
        for (const stmt of statements) {
            sqlite.exec(stmt);
        }
    })();
    sqlite.close();
};
