# LabControl V2 Definitive Edition Implementation Plan

## Overview
This plan outlines the steps to create the definitive version of LabControl, addressing incomplete roadmap items, ensuring technical debt reduction, and implementing robust testing and compliance features.

## Phase 1: Foundation, Infrastructure & Cleanup (DevOps/Architect)
**Goal:** Establish a solid, testable, and modern foundation.
- [ ] **React 19 Upgrade:** Verify and complete the migration to React 19 as claimed in documentation. Resolve peer dependency conflicts (e.g., `lucide-react`).
- [ ] **Testing Infrastructure:** Set up `Vitest` and `React Testing Library`. Add `test` script to `package.json`.
- [ ] **Code Cleanup:** Remove unused files (`stitch_dashboard_principal`, old HTML files), consolidate types in `types.ts`, and enforce strict TypeScript rules.
- [ ] **Linting & Formatting:** Ensure ESLint and Prettier are correctly configured and running.

## Phase 2: Mobile & Field Operations (Frontend/Mobile)
**Goal:** Optimize the application for use on tablets and mobile devices in the lab.
- [ ] **QuickScan Mode:** Implement a continuous scanning mode in `QuickScanModal` for rapid inventory checks.
- [ ] **Swipe Actions:** Add swipe-to-edit/delete gestures for inventory lists on touch devices.
- [ ] **Responsive StorageMatrix:** Refactor `StorageMatrix` to be fully responsive and usable on smaller screens.
- [ ] **Offline SyncQueue:** Implement a robust offline queue system to handle transactions when connectivity is lost and sync when restored.

## Phase 3: Compliance, Reporting & Intelligence (Backend/Data)
**Goal:** Add critical business intelligence and legal compliance features.
- [ ] **Controlled Substances Report:** Implement logic to track and report on items flagged as controlled substances.
- [ ] **Cost Analysis:** Add `cost` field to batches and implement FIFO/Average Cost calculation logic.
- [ ] **Audit Trail Export:** Create a feature to export the `history` table as a tamper-evident PDF or CSV.
- [ ] **Data Integrity Checks:** enhance `runLedgerAudit` to automatically fix minor discrepancies if safe, or flag for review.

## Phase 4: Quality Assurance & Polish (Test/QA)
**Goal:** Ensure the application is bug-free and performant.
- [ ] **Unit Tests:** Write unit tests for critical business logic (`InventoryService`, `ImportWizard`, `HybridStorage`).
- [ ] **Integration Tests:** Write integration tests for the main flows (Add Item, Move Item, Audit).
- [ ] **Performance Optimization:** Audit with Lighthouse, optimize bundle size, lazy load routes, and ensure 60fps scrolling.
- [ ] **Documentation:** Update `README.md`, `FEATURES.md`, and `ARCHITECTURE.md` to reflect the final state.

## Execution Strategy
1.  **Sequential Execution:** We will tackle Phase 1 first to ensure a stable base.
2.  **Parallel Execution:** Phases 2 and 3 can be worked on somewhat in parallel if resources allow (simulated by switching contexts).
3.  **Final Verification:** Phase 4 will be the final gate before release.
