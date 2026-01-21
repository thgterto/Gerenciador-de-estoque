---
date: 2024-05-22
researcher: Jules
repository: labcontrol-umv
topic: "React Duplication Investigation"
status: complete
---

# Research: React Duplication Investigation

**Date**: 2024-05-22
**Researcher**: Jules
**Repository**: labcontrol-umv

## Research Question
Investigate and correct problems involving React duplication.

## Summary
The codebase consists of a single React application configured with Vite. There are no nested `package.json` files that would cause a "monorepo-style" duplication. However, the current `vite.config.ts` lacks explicit alias definitions for `react` and `react-dom`. In environments where dependencies (like `lucide-react` or `echarts` wrappers) might attempt to resolve their own version of React, this missing configuration can lead to the "Two copies of React" error.

## Detailed Findings

### Dependency Structure
- **Root `package.json`**: Declares `react` and `react-dom` version `^18.3.1`.
- **Nested Packages**: No other `package.json` files were found in the repository. `backend/` contains Google Apps Script code but no npm dependencies.
- **Lockfiles**: No `package-lock.json` or `yarn.lock` existed initially.

### Configuration (`vite.config.ts`)
- **Current State**: Uses `@vitejs/plugin-react`.
- **Missing Configuration**: Does not include `resolve.alias` to force `react` resolution to the root `node_modules`.

### Potential Conflict Sources
- `lucide-react`: Listed as `^0.344.0`. Older versions or specific peer dependency mismatches can sometimes trigger duplication if not flattened by the package manager.
- `react-window` / `react-virtualized-auto-sizer`: These are optimized dependencies but typically behave well.

## Architecture Documentation
The project follows a standard Vite + React SPA structure.
- Build Tool: Vite 6.0.1
- Framework: React 18.3.1
- Language: TypeScript

## Recommendations (for Implementation)
To strictly prevent React duplication:
1.  Modify `vite.config.ts` to include explicit aliases for `react` and `react-dom`.
2.  Ensure a clean `npm install` generates a flat `node_modules` structure.
