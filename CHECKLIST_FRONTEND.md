# Frontend Verification Checklist (Orbital Theme & Mobile Nav)

This checklist covers the recent changes introducing the Orbital Theme (Light/Dark modes) and Mobile Bottom Navigation.

## 1. Theming & Aesthetics

- [ ] **Default Theme**: Does the app load in the default theme (Light or Dark based on system preference or last saved)?
- [ ] **Theme Toggle**:
    - [ ] Locate the theme toggle (usually in Header or Settings).
    - [ ] Switch to **Light Mode**. Verify background is light slate/white, text is dark.
    - [ ] Switch to **Dark Mode**. Verify background is deep zinc/black, text is light/white.
    - [ ] Verify accent colors (Cyan) remain visible and consistent in both modes.
- [ ] **Persistence**: Refresh the page. Does the selected theme persist?

## 2. Navigation & Layout

### Desktop (Width > 768px)
- [ ] **Sidebar Visibility**: Is the left Sidebar visible?
- [ ] **Bottom Nav Hidden**: Is the bottom navigation bar hidden?
- [ ] **Link Interaction**: Click each sidebar link (Dashboard, Inventory, etc.).
    - [ ] Does the URL change?
    - [ ] Does the active link highlight correctly (Cyan glow/border)?
- [ ] **Content Area**: Does the main content area occupy the remaining space correctly without horizontal scrollbars?

### Mobile (Width < 768px)
- [ ] **Sidebar Hidden**: Is the desktop sidebar hidden?
- [ ] **Bottom Nav Visibility**: Is the fixed bottom navigation bar visible?
- [ ] **Bottom Nav Items**: Are the 5 core icons (Dash, Items, Buy, Locs, Config) visible and aligned?
- [ ] **Link Interaction**: Tap each bottom nav item.
    - [ ] Does the view update?
    - [ ] Does the active icon scale up/highlight?
- [ ] **Content Padding**: Scroll to the bottom of a long page (e.g., Inventory). Is the last item visible above the bottom nav (check for `pb-16` or similar padding)?

## 3. UI Components (Orbital Design System)

- [ ] **Orbital Cards**:
    - [ ] Check corner accents (tech borders).
    - [ ] Check background and border colors in both themes.
- [ ] **Orbital Buttons**:
    - [ ] Hover states: Do they glow/change color?
    - [ ] Active states: click effect.
- [ ] **Orbital Inputs**:
    - [ ] Focus state: Does the bottom border light up (Cyan)?
    - [ ] Text contrast: Is text readable in both Light/Dark modes?
- [ ] **Modals**:
    - [ ] Open a modal (e.g., "Adicionar Item").
    - [ ] Is the backdrop blurred?
    - [ ] Is the modal centered and styled correctly?
    - [ ] Does it close via 'X' or backdrop click?

## 4. Feature Verification

### Dashboard
- [ ] **Metrics**: Are cards (Total Items, Value, Low Stock) rendering with correct numbers?
- [ ] **Charts**: Are charts visible? (Check contrast in dark mode).

### Inventory
- [ ] **List View**: Does the virtualized list render?
- [ ] **Search**: Type in the search bar. Does the list filter?
- [ ] **Filters**: Test category or location filters.

### Purchases
- [ ] **Add Item**: Click "Adicionar Item". Does the modal open?
- [ ] **List**: If items exist, are they shown in the table?

### Settings
- [ ] **Theme Option**: Is there a redundant or primary theme switch here?
- [ ] **Data Management**: Are buttons for Backup/Import visible?

## 5. Build & Performance

- [ ] **Build**: Run `npm run build`. Does it complete without errors?
- [ ] **Console Errors**: Open DevTools. Are there any critical React or undefined errors during navigation?
