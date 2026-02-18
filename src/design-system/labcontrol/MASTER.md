# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** LabControl
**Generated:** 2026-01-30
**Category:** Laboratory Inventory Management / Enterprise SaaS
**Style:** Soft Modern / Clean SaaS

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#005a7e` (Deep Blue) | `--color-primary` |
| Secondary | `#96b400` (Olive/Lime) | `--color-secondary` |
| Accent/CTA | `#ff681a` (Orange Red) | `--color-accent` |
| Background | `#F9FAFB` (Cool Gray) | `--color-background` |
| Surface | `#FFFFFF` (White) | `--color-surface` |
| Text Main | `#111827` (Gray 900) | `--color-text-main` |
| Text Secondary | `#4B5563` (Gray 600) | `--color-text-secondary` |

**Semantic Colors:**
- **Success:** `#10B981` (Emerald 500)
- **Warning:** `#F59E0B` (Amber 500)
- **Danger:** `#EF4444` (Red 500)
- **Info:** `#3B82F6` (Blue 500)

### Typography

- **Headings (Display):** Space Grotesk
- **Body (Sans):** Inter
- **Code (Mono):** JetBrains Mono
- **Mood:** professional, clean, data-dense, scientific, modern

**Fonts:**
- **Inter:** UI elements, body text, tables.
- **Space Grotesk:** Headlines, major section titles.
- **JetBrains Mono:** Code snippets, identifiers, technical data.

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | `4px` | Tight gaps |
| `sm` | `8px` | Icon gaps, inline spacing |
| `md` | `16px` | Standard padding |
| `lg` | `24px` | Section padding |
| `xl` | `32px` | Large gaps |
| `2xl` | `48px` | Section margins |
| `3xl` | `64px` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `md` | `0 4px 6px -1px rgba(...)` | Cards, buttons |
| `lg` | `0 10px 15px -3px rgba(...)` | Modals, dropdowns |
| `xl` | `0 20px 25px -5px rgba(...)` | Featured elements |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  @apply bg-primary text-white px-4 py-2 rounded shadow-sm transition-colors;
}
.btn-primary:hover {
  @apply bg-primary-hover;
}

/* Secondary Button */
.btn-secondary {
  @apply bg-white text-primary border border-primary px-4 py-2 rounded shadow-sm transition-colors;
}
.btn-secondary:hover {
  @apply bg-primary-light;
}
```

### Cards

```css
.card {
  @apply bg-surface rounded-lg shadow-md p-6 border border-border-light;
}
```

### Inputs

```css
.input {
  @apply px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all;
}
```

---

## Style Guidelines

**Style:** Flat Design / Clean SaaS

**Keywords:** minimalist, bold colors, clean lines, simple shapes, typography-focused, modern, icon-heavy

**Best For:** Enterprise dashboards, inventory management, data visualization

**Key Effects:**
- Subtle shadows for depth (cards on background).
- Clear hierarchy using font weights and sizes.
- Consistent spacing using the 4px grid (xs, sm, md...).
- Hover states should be clear but not distracting (color shift).

### Page Pattern

**Pattern Name:** Enterprise Dashboard

- **Navigation:** Sidebar (Dark/Gunmetal: `#1A1C1E`)
- **Content:** White cards on light gray background.
- **Data:** Dense tables with clear headers and row hover states.

---

## Anti-Patterns (Do NOT Use)

- ❌ **Gradients** — Stick to solid colors for a clean look.
- ❌ **Heavy Shadows** — Use subtle shadows only for lifting.
- ❌ **Cluttered Navigation** — Keep the sidebar organized.

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Lucide React).
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer.
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio.
- ❌ **Instant state changes** — Always use transitions (150-300ms).

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] All icons from **Lucide React**.
- [ ] `cursor-pointer` on all clickable elements.
- [ ] Hover states with smooth transitions.
- [ ] Light mode text contrast 4.5:1 minimum.
- [ ] Responsive layouts (Sidebar collapses on mobile).
