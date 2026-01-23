# 02-FLOW.md (Logic Map)

## 1. Core Transaction Flow (Stock Movement)
This flow represents a user executing an "Entry", "Exit", or "Adjustment".

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant InventoryService
    participant LedgerService
    participant DexieDB
    participant SyncQueue
    participant CloudAPI

    User->>UI: Input Qty & Type (e.g., +10)
    UI->>InventoryService: processTransaction(DTO)

    rect rgb(240, 240, 240)
        note right of InventoryService: ATOMIC TRANSACTION START
        InventoryService->>LedgerService: registerMovement(V2)
        LedgerService->>DexieDB: Insert into 'stock_movements'
        LedgerService->>DexieDB: Update 'balances' (Quantity)
        InventoryService->>DexieDB: Update 'items' (V1 Snapshot)
        InventoryService->>DexieDB: Add to 'history' (Legacy)
        note right of InventoryService: ATOMIC TRANSACTION END
    end

    InventoryService-->>UI: Success
    UI->>User: Update Grid (Optimistic)

    par Async Sync
        InventoryService->>SyncQueue: Enqueue/Trigger Sync
        SyncQueue->>CloudAPI: POST /sync_transaction
        alt Success
            CloudAPI-->>SyncQueue: 200 OK
            SyncQueue->>DexieDB: Remove from Queue
        else Network Error
            SyncQueue->>DexieDB: Mark Retry (Backoff)
        end
    end
```

## 2. Synchronization Strategy (Smart Merge)
This flow describes how the application syncs with the Cloud (Google Sheets) on startup.

```mermaid
graph TD
    A[Start App] --> B{Online?}
    B -- No --> C[Load Local Dexie Data]
    B -- Yes --> D[Fetch Cloud Data (GET read_full_db)]

    D --> E[Receive Data (Catalog, Batches, Balances)]
    E --> F[Check SyncQueue]

    F -- Queue NOT Empty --> G[Push Pending Changes First]
    G --> D

    F -- Queue Empty --> H[Start Smart Merge]

    subgraph Smart Merge Logic
        H --> I{Item exists Locally?}
        I -- Yes --> J[Update Quantity from Cloud]
        I -- No --> K[Insert New Cloud Item]
        J --> L[Preserve Local 'Dirty' Flags]
    end

    L --> M[Commit to Dexie]
    K --> M
    M --> N[Render UI]
```

## 3. Error Handling & Resilience

### A. Transaction Failures
*   **Validation Error:** Thrown immediately (e.g., "Negative Stock"). UI shows Toast.
*   **Storage Error (Quota Exceeded):** `db.transaction` aborts. No data is corrupted. User alerted to clear space.

### B. Sync Failures
*   **Network Timeout (GAS):**
    1.  `SyncQueueService` catches error.
    2.  Increments `retryCount`.
    3.  Schedules retry in `2^n` seconds.
*   **Data Conflict (Server Rejected):**
    1.  Log error to `systemLogs` table.
    2.  Mark queue item as `FAILED`.
    3.  Notify User: "Erro na sincronização. Contate Suporte."

### C. Data Drift (V1 vs V2)
*   **Detection:** `InventoryService.runLedgerAudit()` runs on idle/startup.
*   **Logic:**
    1.  Sum `balances` where `batchId = X`.
    2.  Compare with `items` quantity.
    3.  If `diff > 0`, Auto-update `items` quantity.
```