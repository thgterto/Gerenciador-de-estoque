CREATE TABLE IF NOT EXISTS catalog (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sapCode TEXT,
    casNumber TEXT,
    baseUnit TEXT,
    categoryId TEXT,
    risks TEXT, -- JSON
    itemType TEXT,
    glassVolume TEXT,
    glassMaterial TEXT,
    application TEXT,
    updatedAt TEXT
);

CREATE TABLE IF NOT EXISTS batches (
    id TEXT PRIMARY KEY,
    catalogId TEXT NOT NULL,
    lotNumber TEXT,
    expiryDate TEXT,
    partnerId TEXT,
    status TEXT DEFAULT 'ACTIVE',
    unitCost REAL,
    currency TEXT,
    serialNumber TEXT,
    calibrationDate TEXT,
    maintenanceDate TEXT,
    updatedAt TEXT,
    FOREIGN KEY(catalogId) REFERENCES catalog(id)
);

CREATE TABLE IF NOT EXISTS balances (
    id TEXT PRIMARY KEY,
    batchId TEXT NOT NULL,
    locationId TEXT,
    quantity REAL DEFAULT 0,
    lastMovementAt TEXT,
    status TEXT DEFAULT 'ACTIVE',
    FOREIGN KEY(batchId) REFERENCES batches(id)
);

CREATE TABLE IF NOT EXISTS movements (
    id TEXT PRIMARY KEY,
    itemId TEXT,
    batchId TEXT,
    fromLocationId TEXT,
    toLocationId TEXT,
    type TEXT,
    quantity REAL,
    date TEXT,
    userId TEXT,
    observation TEXT,
    productName TEXT,
    sapCode TEXT,
    lot TEXT,
    unit TEXT
);

CREATE TABLE IF NOT EXISTS systemConfigs (
    key TEXT PRIMARY KEY,
    value TEXT, -- JSON string
    category TEXT,
    updatedAt TEXT
);

CREATE TABLE IF NOT EXISTS syncQueue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    payload TEXT NOT NULL, -- JSON
    status TEXT DEFAULT 'PENDING', -- PENDING, FAILED
    createdAt TEXT,
    retryCount INTEGER DEFAULT 0
);
