
import Database from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
import path from 'path';
import fs from 'fs';
import { config } from '../../config';

// Import Types (to be defined later or assume existing/new)
// For Kysely types, we can define a simplified version here or import full types
// Since Kysely types are generic, we can stick to "any" or basic types for the migration script logic,
// but for the exported `db` instance, we want it typed.

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

export interface UserTable {
  id: string;
  username: string;
  password_hash: string;
  role: 'ADMIN' | 'USER';
}

// --- V2 Tables ---

export interface CatalogTable {
  id: string;
  sap_code: string | null;
  name: string;
  category_id: string | null;
  base_unit: string;
  cas_number: string | null;
  molecular_formula: string | null;
  molecular_weight: number | null;
  risks: string | null; // JSON
  is_controlled: number; // 0 or 1
  min_stock_level: number;
  is_active: number; // 0 or 1
  updated_at: string | null;
}

export interface BatchesTable {
  id: string;
  catalog_id: string;
  lot_number: string;
  expiry_date: string | null;
  partner_id: string | null;
  status: string; // 'ACTIVE', etc.
  unit_cost: number | null;
  updated_at: string | null;
}

export interface StorageLocationsTable {
  id: string;
  name: string;
  type: string | null;
  parent_id: string | null;
  is_active: number;
}

export interface StockBalancesTable {
  id: string;
  batch_id: string;
  location_id: string;
  quantity: number;
  last_movement_at: string | null;
}

export interface StockMovementsTable {
  id: string;
  batch_id: string;
  type: 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'TRANSFERENCIA';
  quantity: number;
  from_location_id: string | null;
  to_location_id: string | null;
  date: string;
  user_id: string | null;
  observation: string | null;
  created_at: string | null;
}

export interface DatabaseSchema {
  products: ProductTable;
  inventory_transactions: InventoryTransactionTable;
  users: UserTable;
  // V2
  catalog: CatalogTable;
  batches: BatchesTable;
  storage_locations: StorageLocationsTable;
  stock_balances: StockBalancesTable;
  stock_movements: StockMovementsTable;
}

const dbPath = config.dbPath;

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

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK(role IN ('ADMIN', 'USER')) NOT NULL DEFAULT 'USER'
);

-- V2 Tables

CREATE TABLE IF NOT EXISTS catalog (
  id TEXT PRIMARY KEY,
  sap_code TEXT UNIQUE,
  name TEXT NOT NULL,
  category_id TEXT,
  base_unit TEXT NOT NULL,
  cas_number TEXT,
  molecular_formula TEXT,
  molecular_weight REAL,
  risks TEXT,
  is_controlled INTEGER DEFAULT 0,
  min_stock_level REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS batches (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL,
  lot_number TEXT NOT NULL,
  expiry_date TEXT,
  partner_id TEXT,
  status TEXT DEFAULT 'ACTIVE',
  unit_cost REAL,
  updated_at TEXT,
  FOREIGN KEY(catalog_id) REFERENCES catalog(id)
);

CREATE TABLE IF NOT EXISTS storage_locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  parent_id TEXT,
  is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS stock_balances (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  location_id TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 0,
  last_movement_at TEXT,
  FOREIGN KEY(batch_id) REFERENCES batches(id),
  FOREIGN KEY(location_id) REFERENCES storage_locations(id),
  UNIQUE(batch_id, location_id)
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  type TEXT CHECK(type IN ('ENTRADA', 'SAIDA', 'AJUSTE', 'TRANSFERENCIA')) NOT NULL,
  quantity REAL NOT NULL,
  from_location_id TEXT,
  to_location_id TEXT,
  date TEXT NOT NULL,
  user_id TEXT,
  observation TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(batch_id) REFERENCES batches(id)
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
