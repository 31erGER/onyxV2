# Project Onyx V2 — Neumorphic UI Redesign (Design Spec)

**Date:** 2026-07-13
**Status:** Approved by user (brainstorming session)
**Visual reference:** `Zielvorstellung.webp` (repo root) — neumorphic smart-home UI, warm off-white surfaces, orange→pink accent gradient, circular temperature dial, pill buttons, floating bottom navigation.

## Goal

Redesign the entire Onyx UI to match the neumorphic target design. Replace the existing 17-theme system with a single neumorphic design system offering:

1. **Light / Dark / Auto mode** (auto follows `prefers-color-scheme`, live).
2. **A user-editable accent gradient**: two contrast colors that fade into each other, edited in Settings (two color pickers + curated presets).
3. Full-app coverage: temperature screen (new circular dial), settings, workflow editor, BLE connect screen, minimalist mode, contact page, navigation.

**Non-negotiable constraints:**

- PWA installability must remain intact (`vite-plugin-pwa`, `public/manifest.json`, install flow in `src/features/settings/InstallPWA/PWAInstall.jsx` stay functional).
- Everything must work on mobile (touch-first).
- Temperature handling always uses the conversion functions in `src/services/utils.js` (`convertToFahrenheitFromCelsius`, `convertToCelsiusFromFahrenheit`, `getDisplayTemperature`) together with the `isF` flag — never reimplemented.
- BLE communication logic (`src/services/`) is not modified; only the UI layer above it.

## Decisions Made

| Question | Decision |
|---|---|
| Fate of the 17 existing themes | **Replaced** by the neumorphic system. Theme files, registry, seasonal auto-rotation, snowfall, and pride rainbow rendering are removed. |
| Light/dark control | System default (`prefers-color-scheme`) + manual override: `auto` / `light` / `dark`. |
| Temperature screen | **Interactive circular dial** (drag on ring + plus/minus buttons). |
| Color editor | Two native color pickers + curated preset pairs, live preview, contrast auto-adjustment. |
| Typography | Modern sans-serif everywhere; `digital-7` font removed. |
| Scope | Entire app, including BLE connect, workflow editor, contact, minimalist mode. |
| Technical approach | **Theme factory** producing the existing theme-object shape plus new neumorphic tokens; components restyled incrementally while staying functional. |

## Architecture

### 1. Theme factory — `src/themes/neumorphic/`

`createNeumorphicTheme(mode, accentStart, accentEnd)` returns one theme object containing:

- **All existing keys from `base.js`** (`buttonColorMain`, `ToggleButtons`, `temperatureRange`, `plusMinusButtons`, `backgroundColor`, `primaryFontColor`, …) mapped to neumorphic values, so every component keeps working during the incremental restyle.
- **New token group `neumorphic`:**
  - Surfaces: light mode warm off-white (≈ `#e8e6e1` family: surface, surface-raised, shadow-dark, shadow-light); dark mode anthracite (≈ `#26262b` family, darker shadow + subtle light highlight).
  - Shadow tokens: `raised` (dark bottom-right + light top-left), `pressed` (inset — active/pressed states, inputs), `flat` (subtle card).
  - Accent: `gradient` (`linear-gradient(135deg, accentStart, accentEnd)`) and `gradientConic` (for the dial ring). Derived values computed in the factory: readable text color on the gradient (black/white by contrast), transparent tint variants for icons/hover, and per-mode contrast auto-adjustment (see below).
  - Radius scale: cards ~20px, buttons pill-shaped. Typography: system sans stack.
- **Contrast guard:** the factory checks accent colors against the active mode's surface color. Insufficient contrast is not blocked but auto-corrected (darken/lighten the tone) so controls always remain visible.

The accent gradient replaces all previous single accent colors: primary buttons, active toggle states, slider fills, dial ring, active nav icons.

### 2. Mode & persistence

- New fields in the existing localStorage config object (`projectOnyxVapeApp` key, `settingsSlice`):
  - `appearanceMode: 'auto' | 'light' | 'dark'` (default `'auto'`)
  - `accentColors: { start: string, end: string }` (default: target-design orange→pink, `#f5a97f` → `#ee7d95`)
- `'auto'` uses a `matchMedia('(prefers-color-scheme: dark)')` listener; mode switches live with the OS.
- `App.jsx` computes the theme via `useMemo(() => createNeumorphicTheme(resolvedMode, start, end), [...])` and passes it to the styled-components `ThemeProvider` as today.
- `<meta name="theme-color">` is updated dynamically to the current surface color so the installed PWA status bar matches the mode.
- **Migration:** on config load, if a legacy `currentTheme` field exists it is mapped once (dark-ish themes → `dark`, light-ish → `light`, otherwise `auto`), the new fields are written, and `currentTheme` is removed. All other settings (workflows, language, temperature presets, …) are untouched.

### 3. Removals

- All 17 theme files under `src/themes/` (incl. `festivities/`, `generators/scaleTheme.js`), `THEME_REGISTRY`, `themeIds.js` usage in the picker, `themeDates.js` seasonal logic, `react-snowfall` dependency.
- `PrideText` rainbow logic: the component **stays as a file** but renders plain text only, so hundreds of call sites need no immediate change. Call-site removal can happen incrementally later.
- `digital-7.mono.ttf` and its `@font-face`.

## Screens

### Temperature screen (`/Volcano/App`)

- **Circular dial** (SVG): gradient-stroked ring showing the **target temperature's** position within the valid range (`MIN_CELSIUS_TEMP`–`MAX_CELSIUS_TEMP` from `src/constants/temperature.js`), with a dot handle at the arc end. Center: current temperature large in modern sans; target temperature small below. `isF` respected via existing conversion utils.
- **Interaction:** dragging on the ring sets target temperature (Pointer Events, touch + mouse). While dragging only local state updates; the BLE write happens on release (debounced) to avoid flooding the connection. Neumorphic **+/− buttons** below the dial for fine adjustment remain.
- Ring pulses subtly while heating.
- **Top row:** round neumorphic icon buttons per the mockup — Heat and Fan as toggle circles (active = gradient fill), plus workflow quick-starts.
- Temperature preset buttons (`temperatureControlValues`) become pill chips under the +/− buttons.
- **Bottom:** card with auto-shutoff display and, when running, workflow progress as a thin gradient line.

### Navigation

Bootstrap navbar replaced by a **floating neumorphic bottom bar** keeping all existing destinations: disconnect/connection, home (temperature), workflow editor, settings, contact. Active tab raised with gradient icon. Desktop: centered at bottom with max width.

### Settings (`/Volcano/Settings`)

- Existing collapsible section structure kept (Appearance, Behavior, System, Volcano, Device) as raised cards.
- **Appearance section** (replaces theme dropdown):
  - Three-part neumorphic segment toggle "Light / Dark / Auto" (active segment inset with gradient tint).
  - **Color editor:** live-preview card (pill button + small gradient ring); two native `<input type="color">` fields for start/end color (mobile-friendly, no extra package); preset row of tappable gradient circles — Sunset (orange→pink, default), Ocean (blue→teal), Lime (green→yellow), Lavender (violet→pink), Ember (red→orange), Mono (gray→silver); reset button restores default. Changes apply live (Redux + localStorage as with all settings).
- All toggles restyled to the mockup pill style (gradient knob when on), sliders (LED brightness, auto-shutoff) with gradient fill and neumorphic thumb, F/C as segment toggle, PWA install as primary gradient button.

### BLE connect screen (`/`)

Centered: app name, large round gradient "Connect" button with pulse animation while scanning, status text below. Error states (no Web Bluetooth, cancel) as neumorphic notice card retaining the existing iOS hint (Bluefy/WebBLE).

### Workflow editor (`/Volcano/WorkflowEditor`)

Accordion items become raised cards with pill headers; expanded state is an inset surface. Drag & drop (react-dnd) unchanged. Buttons in the new system: primary actions gradient, secondary neutral raised, delete with red tint. No functional changes.

### Minimalist mode & contact

Minimalist: compact dial variant (ring + current temperature + heat/fan only). Contact: simple neumorphic card.

## Error handling

- Color editor: contrast guard auto-adjusts (never blocks); invalid/missing config values fall back to defaults.
- Migration is defensive: unknown legacy theme IDs → `auto` + default accents.
- Dial drag clamps to the valid Celsius range via existing constants (`MIN_CELSIUS_TEMP`, `MAX_CELSIUS_TEMP`); BLE writes only on release, debounced.

## Verification

No test runner is configured. Quality gates:

1. `npm run lint` and `npm run build` pass cleanly.
2. Manual/browser verification against the dev server for core flows: mode switching (incl. OS-level auto), color editor live updates + persistence across reload, dial drag via touch emulation, settings toggles, workflow editor drag & drop, PWA install prompt still appearing, migration from a legacy config.
3. Mobile viewport check for every screen (touch targets, no horizontal scroll).
