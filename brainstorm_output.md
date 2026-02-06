## 🧠 Brainstorm: Portable Application Conversion (Frontend & Backend)

### Context
We need to convert the current LabControl application (which relies on Google Apps Script for backend logic and Google Sheets as a database in its 'cloud' mode) into a fully portable solution. The current state is already hybrid: it has an Electron wrapper for the frontend (React 19) and a local SQLite/IndexedDB capability, but reliance on Google services for synchronization or 'backend' logic persists in some workflows (like imports/sync). The goal is to make both frontend and backend truly portable, likely meaning a self-contained executable that doesn't strictly depend on external cloud services for core functionality.

---

### Option A: Electron + Integrated Node.js Backend (The 'Thick Client' Approach)
Embed a lightweight Node.js server (e.g., Express or Fastify) *inside* the Electron main process or as a sidecar process. This replaces Google Apps Script entirely for local operations.

✅ **Pros:**
- **True Portability:** A single `.exe`/`.dmg` file contains everything (UI, DB, API logic).
- **Zero Config:** User just runs the app; no external server setup required.
- **Code Reuse:** We can reuse existing TypeScript business logic from the frontend/services.
- **Performance:** Local IPC or localhost HTTP is faster than network calls to Google.

❌ **Cons:**
- **Concurrency:** SQLite/IndexedDB concurrency needs careful management (already partially handled by `better-sqlite3` in WAL mode).
- **Bundle Size:** Electron is already heavy; adding server logic increases size slightly (though negligible compared to Chromium).
- **Sync Complexity:** If multi-user sync is ever needed later, we'd need a way to 'export/import' or sync p2p, as there's no central cloud.

📊 **Effort:** Medium (Logic porting required)

---

### Option B: Dockerized Container (The 'Server-Client' Approach)
Package the backend (Node.js/Python) and database (PostgreSQL/SQLite) in a Docker container, and serve the React frontend from there or as a separate container.

✅ **Pros:**
- **Separation of Concerns:** Clean split between frontend and backend.
- **Scalability:** Easier to move to a real server later if needed.
- **Standardization:** Uses standard deployment practices.

❌ **Cons:**
- **User Friction:** Requires user to have Docker installed (major hurdle for non-technical lab staff).
- **Not truly 'Portable' Desktop App:** It's a web app running locally, not a native-feeling desktop app.
- **Overhead:** Running Docker Desktop is heavy.

📊 **Effort:** Low (Standard web dev patterns)

---

### Option C: Pure Offline-First PWA + IndexedDB (The 'No Backend' Approach)
Double down on the current architecture but remove the Google Apps Script dependency entirely for the portable version. All logic moves to the Frontend (Client-side). 'Backend' becomes just a persistence layer (IndexedDB/SQLite via Electron).

✅ **Pros:**
- **Simplicity:** No separate backend process to manage/crash.
- **Speed:** Zero network latency.
- **Already Started:** The project already has `InventoryService` and `HybridStorage` which do much of this.

❌ **Cons:**
- **Security:** Business logic in the client is less secure (easier to tamper with if code is inspected), though less relevant for a local-only tool.
- **Heavy Client:** The browser/renderer process handles all heavy lifting (imports, massive data processing).
- **Data Integrity:** Harder to enforce strict ACID compliance compared to a dedicated SQL backend process (though `better-sqlite3` in Main process helps).

📊 **Effort:** Low (Refactoring existing services)

---

## 💡 Recommendation

**Option A (Electron + Integrated Node.js Backend)** is the strongest path for a 'Portable LIMS'.

**Reasoning:**
1.  **User Experience:** Lab staff expect a double-click-to-run experience, not `docker-compose up`.
2.  **Architecture:** You already have `electron/db.cjs` using `better-sqlite3`. Expanding this into a proper IPC-based controller layer (acting as the 'backend') allows you to migrate logic out of GAS (Google Apps Script) into the Electron Main process.
3.  **Performance:** Offloading heavy tasks (like Excel parsing or bulk updates) to the Main process (Node.js) prevents the UI (React) from freezing, which is a risk with Option C.

**Proposed Strategy:**
1.  **Migrate Logic:** Move complex business rules from `GoogleAppsScript.js` to `electron/main.cjs` (or new controller files).
2.  **Unify API:** Ensure `InventoryService` (Frontend) calls `window.electronAPI` which routes to local Node.js functions instead of `fetch()`ing GAS URLs.
3.  **Data Persistence:** Continue refining the SQLite schema in `electron/db` to match the relational rigor of a real backend.
