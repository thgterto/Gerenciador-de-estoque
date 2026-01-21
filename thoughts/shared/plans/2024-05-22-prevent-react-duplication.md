# Prevent React Duplication Implementation Plan

## Overview

We are addressing a "Two copies of React" issue caused by dependencies (like `lucide-react` or others) potentially resolving their own version of React. This is common in Vite projects where dependencies might not be flattened correctly or when symlinks are involved. We will enforce a single React instance using Vite aliases.

## Current State Analysis

The project is a Vite + React application.
- **Root `package.json`** defines `react` and `react-dom` as dependencies.
- **`vite.config.ts`** uses default configuration without path aliases for React.
- **`node_modules`** structure might allow nested `react` installations if dependencies specify conflicting peer dependency ranges (e.g. `lucide-react` vs `react@18.3.1`).
- No `package-lock.json` was initially found (or valid), increasing the risk of inconsistent installs.

## Desired End State

- `vite.config.ts` explicitly maps `react` and `react-dom` to the root `node_modules` versions.
- This ensures that even if a nested dependency has its own `node_modules/react`, the bundler will resolve imports to the root instance.
- The application builds and runs without "Invalid hook call" or duplication errors.

### Key Discoveries:
- `vite.config.ts` currently lacks `resolve.alias`.
- `lucide-react` is a known dependency that can trigger this if versions mismatch.

## What We're NOT Doing

- We are not converting the project to a monorepo.
- We are not manually deduping `node_modules` via `npm dedupe` (though it's good practice, the alias is a more robust build-time guarantee).

## Implementation Approach

We will modify `vite.config.ts` to use `resolve.alias`. This is the standard Vite/Webpack solution for this problem.

## Phase 1: Configure Vite Aliases

### Overview
Add path aliases to `vite.config.ts` to force all `react` imports to resolve to the top-level `node_modules`.

### Changes Required:

#### 1. Vite Configuration
**File**: `vite.config.ts`
**Changes**: Add `resolve.alias` configuration.

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      react: path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
  },
  server: {
    host: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['react-virtualized-auto-sizer', 'react-window']
  }
})
```

### Success Criteria:

#### Automated Verification:
- [ ] Build succeeds: `npx vite build`

#### Manual Verification:
- [ ] Application loads in browser without console errors regarding React hooks.

---

## Testing Strategy

### Unit Tests:
- N/A (Configuration change)

### Integration Tests:
- Build process verification.

### Manual Testing Steps:
1. Run `npm install`.
2. Run `npm run dev`.
3. Open the app and check DevTools console for "Two copies of React" or "Invalid hook call" warnings.

## Performance Considerations

- Should strictly improve stability; no negative performance impact.

## Migration Notes

- None.

## References

- Vite options: https://vitejs.dev/config/shared-options.html#resolve-alias
