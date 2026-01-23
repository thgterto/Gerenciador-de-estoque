# 04-ENV.md (Setup)

## 1. Dependencies (`package.json`)

### Core Runtime
*   **React 19**: `react`, `react-dom` (^18.3.1 or higher).
*   **Router**: `react-router-dom` (^6.28.0).
*   **Database**: `dexie` (^4.0.1).
*   **Icons**: `lucide-react`.

### Visualization & Virtualization
*   **Charts**: `apexcharts`, `react-apexcharts`, `echarts`.
*   **Grid**: `react-window` (Critical for performance with >1000 items), `react-virtualized-auto-sizer`.

### Utils
*   `xlsx`: For Excel Import/Export.
*   `html5-qrcode`, `react-qr-code`: Scanning.

### Dev & Build
*   `vite` (^6.0.1): Build tool.
*   `typescript` (^5.7.2).
*   `tailwindcss`, `postcss`, `autoprefixer`.
*   `electron`, `electron-builder`: For Desktop packaging.

## 2. Configuration Files

### `vite.config.ts`
Must be configured to support:
1.  **Relative Paths**: `base: './'` (Required for Electron file:// protocol).
2.  **React Plugin**: `@vitejs/plugin-react`.
3.  **Build Target**: `esnext`.

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // CRITICAL FOR ELECTRON
  build: {
    target: 'esnext'
  }
})
```

### `tsconfig.json`
*   `"target": "ES2020"`
*   `"moduleResolution": "bundler"`
*   `"jsx": "react-jsx"`
*   `"strict": true`

### `tailwind.config.js`
Standard Setup + Custom Colors for "Lab" theme (Medical/Clean look).

## 3. Environment Variables (`.env`)

```ini
# API URL for Google Apps Script (GAS)
# Obtained after deploying the backend/GoogleAppsScript.js script
VITE_API_URL=https://script.google.com/macros/s/DEPLOYMENT_ID/exec

# Feature Flags
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_DEBUG_LOGS=false
```

## 4. Setup Instructions

1.  **Install**: `npm install`
    *   *Note:* Use `npm install --legacy-peer-deps` if React 19 conflicts occur with Lucide.
2.  **Dev (Web)**: `npm run dev`
3.  **Dev (Electron)**: `npm run electron:dev`
4.  **Build**: `npm run build` (Outputs to `/dist`)
5.  **Pack**: `npm run electron:build` (Outputs to `/release`)

## 5. Backend Deployment
1.  Go to `script.google.com`.
2.  Create new project.
3.  Paste contents of `backend/GoogleAppsScript.js`.
4.  **Deploy as Web App**:
    *   Execute as: *Me*
    *   Access: *Anyone* (or *Anyone within Organization*)
5.  Copy URL to `.env`.
