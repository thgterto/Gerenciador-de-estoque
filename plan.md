# Palette UX Enhancement Plan: Accessible Icon Buttons

## Overview
Based on the `palette.md` journal entry "Accessibility of Icon Buttons" from 2025-05-23, when using icon-only buttons with an `aria-label`, the icon element itself (e.g., `<RefreshCw />`, `<ScanLine />`, `<Search />`) needs `aria-hidden="true"`. This prevents screen readers from redundantly or confusingly reading the icon's SVG representation or ligature.

I will update several components where icon-only buttons have an `aria-label` but the inner icon is missing `aria-hidden="true"`.

## Implementation Approach
I will add `aria-hidden="true"` to icons within buttons that have an `aria-label`.

Target components:
1. `src/components/item-form/BatchInfo.tsx` (RefreshCw and ScanLine icons)
2. `src/components/ItemForm.tsx` (Search and ScanLine icons)
3. `src/components/Header.tsx` (Ensure all icons within `aria-label` buttons have `aria-hidden="true"` - many already do, but I'll double check)

## Pre-commit Steps
1. Call the `pre_commit_instructions` tool to get the necessary pre-commit steps and follow them to ensure proper testing, verification, review, and reflection.

## Verification
- Run `pnpm lint`
- Run `pnpm test` (if applicable)
- Verify `pnpm build` or `npx vite build`
