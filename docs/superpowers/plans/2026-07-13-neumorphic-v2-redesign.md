# Neumorphic V2 UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Onyx's 17-theme system with a neumorphic design system (light/dark/auto mode + user-editable 2-color accent gradient) and restyle the entire app to match `Zielvorstellung.webp`, per the approved spec `docs/superpowers/specs/2026-07-13-neumorphic-v2-redesign-design.md`.

**Architecture:** A theme factory `createNeumorphicTheme(mode, accentStart, accentEnd)` produces a theme object that keeps every key the old `base.js` theme had (so all components keep working mid-migration) plus a new `neumorphic` token group. Components are then restyled task by task. Old theme files are deleted only in the final cleanup task, after every consumer is rewired.

**Tech Stack:** React 19, styled-components v5, Redux Toolkit, react-bootstrap (kept for Accordion/Modal/forms), Vite 7 + vite-plugin-pwa (untouched), Vitest (added for pure-function tests).

## Global Constraints

- Everything must work on mobile (touch-first; Pointer Events for drag).
- Temperature always via `convertToFahrenheitFromCelsius` / `convertToCelsiusFromFahrenheit` / `getDisplayTemperature` from `src/services/utils.js`, always paired with the `isF` flag. Never reimplement conversion.
- Temperature range constants: `MIN_CELSIUS_TEMP` (40), `MAX_CELSIUS_TEMP` (230), `DEGREE_SYMBOL` from `src/constants/temperature.js`.
- PWA installability stays intact: do not touch `vite.config.mjs` PWA config, `public/manifest.json`, or `src/features/settings/InstallPWA/PWAInstall.jsx` logic (styling only).
- BLE logic (`src/services/`, all `AddToQueue`/characteristic code) is never modified — only moved verbatim when a component is replaced.
- Default accent: `#f5a97f` → `#ee7d95`. Light surface family `#e8e6e1`, dark surface family `#26262b`.
- localStorage key stays `"projectOnyxVapeApp"` (`localStorageKey` in `src/constants/constants.js`).
- styled-components v5 syntax; transient props (`$primary`) for styling-only props.
- React 19: do NOT use `Component.defaultProps` on function components (deprecated) — use default parameter values.
- Each task ends with `npm run lint` passing and a commit.
- All user-facing strings via i18next `t()`. New keys must be added to ALL of `src/i18n/{en,de,fr,es,pl,binary,elvish}/translation.json` (en + de translated; fr/es/pl/binary/elvish may copy the English value).

## File Structure

**New files:**

| File | Responsibility |
|---|---|
| `src/themes/neumorphic/colorUtils.js` | Pure color math: hex↔rgb, luminance, contrast, mix, alpha, contrast guard |
| `src/themes/neumorphic/colorUtils.test.js` | Tests for the above |
| `src/themes/neumorphic/createNeumorphicTheme.js` | Theme factory + surface palettes + default accent |
| `src/themes/neumorphic/createNeumorphicTheme.test.js` | Tests: legacy-key shape, modes, contrast guard |
| `src/themes/neumorphic/presets.js` | `ACCENT_PRESETS` array (6 curated pairs) |
| `src/themes/neumorphic/useResolvedMode.js` | Hook: `'auto'` → matchMedia-resolved `'light'`/`'dark'` |
| `src/services/configMigration.js` | Pure legacy-config → V2-config migration |
| `src/services/configMigration.test.js` | Tests for migration |
| `src/features/shared/neumorphic/NeuCard.jsx` | Raised/inset surface card |
| `src/features/shared/neumorphic/NeuButton.jsx` | Pill button (neutral / `$primary` gradient / `$danger`) |
| `src/features/shared/neumorphic/NeuIconButton.jsx` | Round icon button (`$active` = gradient fill) |
| `src/features/shared/neumorphic/SegmentToggle.jsx` | N-segment inset toggle (mode picker, F/C) |
| `src/features/shared/BottomNav/BottomNav.jsx` | Floating bottom navigation bar |
| `src/features/deviceInteraction/TemperatureDial/dialMath.js` | Pure angle/arc/temp math |
| `src/features/deviceInteraction/TemperatureDial/dialMath.test.js` | Tests for dial math |
| `src/features/deviceInteraction/TemperatureDial/TemperatureDial.jsx` | Presentational SVG dial (drag on ring) |
| `src/features/deviceInteraction/TemperatureDial/TemperatureDialContainer.jsx` | BLE subscriptions + commit-on-release |
| `src/features/settings/Appearance/AppearanceSettings.jsx` | Mode toggle + accent color editor + presets |

**Modified:** `package.json`, `src/services/utils.js`, `src/features/settings/settingsSlice.js`, `src/App.jsx`, `src/themes/PrideText.jsx`, `src/features/shared/styledComponents/Switch.jsx`, `src/features/shared/OutletRenderer/VolcanoLoader.jsx`, `src/features/deviceInteraction/DeviceInteraction.jsx`, `src/features/deviceInteraction/WriteTemperature/styledComponents.jsx`, `src/features/settings/Settings.jsx`, `src/features/settings/SettingsSection.jsx`, `src/features/settings/Shared/SettingsRange/SettingsRange.jsx`, `src/features/deviceBLEconnection/Ble.jsx`, `src/features/workflowEditor/WorkflowEditor.jsx`, `src/features/shared/MinimalistLayout.jsx`, `src/features/contactMe/ContactMe.jsx`, `src/index.css`, all 7 `src/i18n/*/translation.json`.

**Deleted (Task 14 only):** all old theme files, `Snowfall.jsx`, `themeDates.js`, `themeIds.js`, `Theming/`, `digital-7.mono.ttf`, `react-snowfall` dependency.

---

### Task 1: Vitest setup + color utilities

**Files:**
- Modify: `package.json` (devDependency + script)
- Create: `src/themes/neumorphic/colorUtils.js`
- Test: `src/themes/neumorphic/colorUtils.test.js`

**Interfaces:**
- Produces: `hexToRgb(hex) → {r,g,b}`, `rgbToHex({r,g,b}) → '#rrggbb'`, `mix(hexA, hexB, weight) → hex` (weight = share of A, 0..1), `withAlpha(hex, alpha) → 'rgba(...)'`, `relativeLuminance(hex) → number`, `contrastRatio(hexA, hexB) → number ≥ 1`, `readableTextOn(hex) → '#1c1c20' | '#ffffff'`, `ensureContrast(hex, surfaceHex, minRatio = 1.5) → hex`.

- [ ] **Step 1: Install vitest and add test script**

Run: `npm install -D vitest`

In `package.json` scripts add: `"test": "vitest run"`.

- [ ] **Step 2: Write the failing test**

Create `src/themes/neumorphic/colorUtils.test.js`:

```js
import { describe, it, expect } from "vitest";
import {
  hexToRgb,
  rgbToHex,
  mix,
  withAlpha,
  relativeLuminance,
  contrastRatio,
  readableTextOn,
  ensureContrast,
} from "./colorUtils";

describe("hexToRgb / rgbToHex", () => {
  it("parses 6-digit hex", () => {
    expect(hexToRgb("#f5a97f")).toEqual({ r: 245, g: 169, b: 127 });
  });
  it("parses 3-digit hex", () => {
    expect(hexToRgb("#fff")).toEqual({ r: 255, g: 255, b: 255 });
  });
  it("round-trips", () => {
    expect(rgbToHex(hexToRgb("#ee7d95"))).toBe("#ee7d95");
  });
});

describe("mix", () => {
  it("weight 1 returns first color", () => {
    expect(mix("#ff0000", "#0000ff", 1)).toBe("#ff0000");
  });
  it("weight 0 returns second color", () => {
    expect(mix("#ff0000", "#0000ff", 0)).toBe("#0000ff");
  });
  it("midpoint mixes channels", () => {
    expect(mix("#000000", "#ffffff", 0.5)).toBe("#808080");
  });
});

describe("withAlpha", () => {
  it("produces rgba string", () => {
    expect(withAlpha("#ffffff", 0.5)).toBe("rgba(255, 255, 255, 0.5)");
  });
});

describe("contrastRatio", () => {
  it("black on white is 21", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });
  it("is symmetric", () => {
    expect(contrastRatio("#f5a97f", "#26262b")).toBeCloseTo(
      contrastRatio("#26262b", "#f5a97f"),
      5
    );
  });
});

describe("readableTextOn", () => {
  it("dark text on a light color", () => {
    expect(readableTextOn("#e8e6e1")).toBe("#1c1c20");
  });
  it("white text on a dark color", () => {
    expect(readableTextOn("#26262b")).toBe("#ffffff");
  });
});

describe("ensureContrast", () => {
  it("returns the color unchanged when contrast is sufficient", () => {
    expect(ensureContrast("#ee7d95", "#e8e6e1", 1.5)).toBe("#ee7d95");
  });
  it("adjusts a low-contrast color until the ratio is met (light surface)", () => {
    const fixed = ensureContrast("#eceae5", "#e8e6e1", 1.5);
    expect(contrastRatio(fixed, "#e8e6e1")).toBeGreaterThanOrEqual(1.5);
  });
  it("adjusts a low-contrast color on a dark surface", () => {
    const fixed = ensureContrast("#2b2b31", "#26262b", 1.5);
    expect(contrastRatio(fixed, "#26262b")).toBeGreaterThanOrEqual(1.5);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/themes/neumorphic/colorUtils.test.js`
Expected: FAIL — cannot resolve `./colorUtils`.

- [ ] **Step 4: Implement `colorUtils.js`**

```js
export function hexToRgb(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }) {
  const toHex = (v) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function mix(hexA, hexB, weight) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const w = Math.max(0, Math.min(1, weight));
  return rgbToHex({
    r: a.r * w + b.r * (1 - w),
    g: a.g * w + b.g * (1 - w),
    b: a.b * w + b.b * (1 - w),
  });
}

export function withAlpha(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const channel = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(hexA, hexB) {
  const la = relativeLuminance(hexA);
  const lb = relativeLuminance(hexB);
  const [light, dark] = la >= lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
}

export function readableTextOn(hex) {
  return contrastRatio(hex, "#1c1c20") >= contrastRatio(hex, "#ffffff")
    ? "#1c1c20"
    : "#ffffff";
}

// Nudges `hex` away from `surfaceHex` (5% steps toward black or white,
// whichever direction the surface is NOT) until minRatio is met.
export function ensureContrast(hex, surfaceHex, minRatio = 1.5) {
  if (contrastRatio(hex, surfaceHex) >= minRatio) {
    return hex;
  }
  const target =
    relativeLuminance(surfaceHex) >= 0.5 ? "#000000" : "#ffffff";
  let result = hex;
  for (let i = 0; i < 20; i++) {
    result = mix(target, result, 0.05);
    if (contrastRatio(result, surfaceHex) >= minRatio) {
      return result;
    }
  }
  return result;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/themes/neumorphic/colorUtils.test.js`
Expected: PASS (all suites).

- [ ] **Step 6: Lint and commit**

```bash
npm run lint
git add package.json package-lock.json src/themes/neumorphic/
git commit -m "feat: add vitest and neumorphic color utilities"
```

---

### Task 2: Theme factory + presets

**Files:**
- Create: `src/themes/neumorphic/createNeumorphicTheme.js`
- Create: `src/themes/neumorphic/presets.js`
- Test: `src/themes/neumorphic/createNeumorphicTheme.test.js`

**Interfaces:**
- Consumes: everything from `./colorUtils` (Task 1).
- Produces: `createNeumorphicTheme(mode, accentStart, accentEnd) → theme` (default export), `DEFAULT_ACCENT = { start: '#f5a97f', end: '#ee7d95' }`, `SURFACES = { light: {...}, dark: {...} }` (named exports); `ACCENT_PRESETS` from `presets.js` — array of `{ id, start, end }`. The theme object contains ALL legacy keys listed in the test below plus `theme.neumorphic` with: `mode`, `surface`, `text`, `textSecondary`, `shadowDark`, `shadowLight`, `raised`, `raisedSmall`, `pressed`, `flat`, `radiusCard`, `radiusPill`, `danger`, `onDanger`, `accent: { start, end, gradient, gradientVertical, tint, onAccent }`.

- [ ] **Step 1: Write the failing test**

Create `src/themes/neumorphic/createNeumorphicTheme.test.js`:

```js
import { describe, it, expect } from "vitest";
import createNeumorphicTheme, {
  SURFACES,
  DEFAULT_ACCENT,
} from "./createNeumorphicTheme";
import { ACCENT_PRESETS } from "./presets";
import { contrastRatio } from "./colorUtils";

// Every key the old base.js theme exposed — legacy components rely on these.
const LEGACY_KEYS = [
  "author",
  "themeId",
  "borderStyle",
  "borderColor",
  "buttonColorMain",
  "currentTemperatureColor",
  "targetTemperatureColor",
  "buttonActive",
  "backgroundColor",
  "primaryFontColor",
  "iconColor",
  "iconTextColor",
  "plusMinusButtons",
  "temperatureRange",
  "workflowEditor",
  "ToggleButtons",
];

describe("createNeumorphicTheme", () => {
  it("keeps every legacy base.js key", () => {
    const theme = createNeumorphicTheme("light");
    for (const key of LEGACY_KEYS) {
      expect(theme).toHaveProperty(key);
    }
  });

  it("light mode uses the light surface", () => {
    const theme = createNeumorphicTheme("light");
    expect(theme.backgroundColor).toBe(SURFACES.light.surface);
    expect(theme.neumorphic.mode).toBe("light");
  });

  it("dark mode uses the dark surface", () => {
    const theme = createNeumorphicTheme("dark");
    expect(theme.backgroundColor).toBe(SURFACES.dark.surface);
    expect(theme.themeId).toBe("neumorphic-dark");
  });

  it("unknown mode falls back to light", () => {
    expect(createNeumorphicTheme("nonsense").neumorphic.mode).toBe("light");
  });

  it("missing accents fall back to DEFAULT_ACCENT", () => {
    const theme = createNeumorphicTheme("light");
    expect(theme.neumorphic.accent.start).toBe(DEFAULT_ACCENT.start);
    expect(theme.neumorphic.accent.end).toBe(DEFAULT_ACCENT.end);
  });

  it("gradient string contains both (guarded) accent colors", () => {
    const t = createNeumorphicTheme("dark", "#5aa7e8", "#4fd6c3");
    expect(t.neumorphic.accent.gradient).toContain("#5aa7e8");
    expect(t.neumorphic.accent.gradient).toContain("#4fd6c3");
    expect(t.neumorphic.accent.gradient).toContain("135deg");
  });

  it("contrast guard fixes accents too close to the surface", () => {
    const t = createNeumorphicTheme("light", "#e9e7e2", "#e8e6e1");
    expect(
      contrastRatio(t.neumorphic.accent.start, SURFACES.light.surface)
    ).toBeGreaterThanOrEqual(1.5);
    expect(
      contrastRatio(t.neumorphic.accent.end, SURFACES.light.surface)
    ).toBeGreaterThanOrEqual(1.5);
  });

  it("temperatureRange gradient uses the accent colors", () => {
    const t = createNeumorphicTheme("light");
    expect(t.temperatureRange.background).toContain(DEFAULT_ACCENT.start);
    expect(t.temperatureRange.background).toContain(DEFAULT_ACCENT.end);
  });
});

describe("ACCENT_PRESETS", () => {
  it("has 6 presets with id/start/end", () => {
    expect(ACCENT_PRESETS).toHaveLength(6);
    for (const p of ACCENT_PRESETS) {
      expect(p).toHaveProperty("id");
      expect(p.start).toMatch(/^#[0-9a-f]{6}$/);
      expect(p.end).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/themes/neumorphic/createNeumorphicTheme.test.js`
Expected: FAIL — cannot resolve `./createNeumorphicTheme`.

- [ ] **Step 3: Implement `presets.js`**

```js
export const ACCENT_PRESETS = [
  { id: "sunset", start: "#f5a97f", end: "#ee7d95" },
  { id: "ocean", start: "#5aa7e8", end: "#4fd6c3" },
  { id: "lime", start: "#7fbf5f", end: "#e8d34f" },
  { id: "lavender", start: "#9d7fe8", end: "#e87fc4" },
  { id: "ember", start: "#e85a4f", end: "#f5a05f" },
  { id: "mono", start: "#8a8a92", end: "#c4c4cc" },
];
```

- [ ] **Step 4: Implement `createNeumorphicTheme.js`**

```js
import {
  ensureContrast,
  mix,
  readableTextOn,
  withAlpha,
} from "./colorUtils";

export const SURFACES = {
  light: {
    surface: "#e8e6e1",
    shadowDark: "#c8c4bc",
    shadowLight: "#ffffff",
    text: "#3f3f46",
    textSecondary: "#8a8781",
  },
  dark: {
    surface: "#26262b",
    shadowDark: "#18181c",
    shadowLight: "#33333a",
    text: "#e8e6e1",
    textSecondary: "#9b9ba3",
  },
};

export const DEFAULT_ACCENT = { start: "#f5a97f", end: "#ee7d95" };

export default function createNeumorphicTheme(mode, accentStart, accentEnd) {
  const resolvedMode = mode === "dark" ? "dark" : "light";
  const s = SURFACES[resolvedMode];

  const start = ensureContrast(accentStart || DEFAULT_ACCENT.start, s.surface);
  const end = ensureContrast(accentEnd || DEFAULT_ACCENT.end, s.surface);
  const gradient = `linear-gradient(135deg, ${start}, ${end})`;
  const gradientVertical = `linear-gradient(to top, ${end}, ${start})`;
  const onAccent = readableTextOn(mix(start, end, 0.5));
  const danger = resolvedMode === "dark" ? "#e06060" : "#d64545";

  const raised = `6px 6px 12px ${withAlpha(s.shadowDark, 0.85)}, -6px -6px 12px ${withAlpha(s.shadowLight, resolvedMode === "dark" ? 0.4 : 0.9)}`;
  const raisedSmall = `3px 3px 6px ${withAlpha(s.shadowDark, 0.85)}, -3px -3px 6px ${withAlpha(s.shadowLight, resolvedMode === "dark" ? 0.4 : 0.9)}`;
  const pressed = `inset 4px 4px 8px ${withAlpha(s.shadowDark, 0.85)}, inset -4px -4px 8px ${withAlpha(s.shadowLight, resolvedMode === "dark" ? 0.35 : 0.8)}`;
  const flat = `2px 2px 5px ${withAlpha(s.shadowDark, 0.5)}, -2px -2px 5px ${withAlpha(s.shadowLight, resolvedMode === "dark" ? 0.25 : 0.6)}`;

  return {
    author: "Project Onyx V2",
    themeId: `neumorphic-${resolvedMode}`,
    borderStyle: "solid",
    borderColor: "transparent",
    buttonColorMain: s.surface,
    currentTemperatureColor: s.text,
    targetTemperatureColor: s.textSecondary,
    buttonActive: {
      color: onAccent,
      backgroundColor: start,
      borderColor: "transparent",
    },
    backgroundColor: s.surface,
    primaryFontColor: s.text,
    iconColor: start,
    iconTextColor: s.text,
    plusMinusButtons: {
      backgroundColor: s.surface,
      color: s.text,
      borderColor: "transparent",
    },
    temperatureRange: {
      lowTemperatureColor: start,
      highTemperatureColor: end,
      background: `linear-gradient(90deg, ${start}, ${end})`,
      backgroundVertical: gradientVertical,
      rangeBoxColor: s.surface,
      rangeBoxBorderColor: "transparent",
      rangeBackground: undefined,
      rangeBoxBorderRadius: "50%",
      rangeBoxBorderWidth: "0px",
    },
    workflowEditor: {
      accordionExpandedColor: mix(s.shadowDark, s.surface, 0.35),
    },
    ToggleButtons: {
      sliderBackgroundColorOn: s.surface,
      sliderBackgroundColorOff: s.surface,
      sliderBorderColorOn: "transparent",
      sliderBorderColorOff: "transparent",
      onBackgroundColor: gradient,
      onBorderColor: "transparent",
      onColor: onAccent,
      offBackgroundColor: mix(s.shadowDark, s.surface, 0.4),
      offBorderColor: "transparent",
      offColor: s.textSecondary,
      backgroundImageOn: undefined,
      backgroundImageOff: undefined,
      backgroundBlendModeOn: "unset",
      backgroundBlendModeOff: "unset",
    },
    neumorphic: {
      mode: resolvedMode,
      surface: s.surface,
      text: s.text,
      textSecondary: s.textSecondary,
      shadowDark: s.shadowDark,
      shadowLight: s.shadowLight,
      raised,
      raisedSmall,
      pressed,
      flat,
      radiusCard: "20px",
      radiusPill: "999px",
      danger,
      onDanger: readableTextOn(danger),
      accent: {
        start,
        end,
        gradient,
        gradientVertical,
        tint: withAlpha(start, 0.18),
        onAccent,
      },
    },
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/themes/neumorphic/createNeumorphicTheme.test.js`
Expected: PASS.

- [ ] **Step 6: Lint and commit**

```bash
npm run lint
git add src/themes/neumorphic/
git commit -m "feat: add neumorphic theme factory and accent presets"
```

---

### Task 3: Config migration + settings slice fields

**Files:**
- Create: `src/services/configMigration.js`
- Test: `src/services/configMigration.test.js`
- Modify: `src/services/utils.js` (`ReadConfigFromLocalStorage`)
- Modify: `src/features/settings/settingsSlice.js` (two new reducers)

**Interfaces:**
- Consumes: `DEFAULT_ACCENT` from `src/themes/neumorphic/createNeumorphicTheme.js`.
- Produces: `migrateLegacyConfig(config) → config` (named export, pure — no localStorage access). New config fields: `appearanceMode: 'auto'|'light'|'dark'`, `accentColors: { start, end }`. New actions: `setAppearanceMode(mode)`, `setAccentColors({start,end})` — both persist via `WriteNewConfigToLocalStorage`.

- [ ] **Step 1: Write the failing test**

Create `src/services/configMigration.test.js`:

```js
import { describe, it, expect } from "vitest";
import { migrateLegacyConfig } from "./configMigration";
import { DEFAULT_ACCENT } from "../themes/neumorphic/createNeumorphicTheme";

describe("migrateLegacyConfig", () => {
  it("maps legacy light themes to light mode and drops currentTheme", () => {
    for (const legacy of ["Light", "Flamingo", "Valentines Day"]) {
      const result = migrateLegacyConfig({ currentTheme: legacy });
      expect(result.appearanceMode).toBe("light");
      expect(result.currentTheme).toBeUndefined();
    }
  });

  it("maps legacy dark themes to dark mode", () => {
    for (const legacy of ["Dark", "Volcanic Ash", "Halloween", "Fun"]) {
      expect(migrateLegacyConfig({ currentTheme: legacy }).appearanceMode).toBe(
        "dark"
      );
    }
  });

  it("maps the legacy auto theme to auto", () => {
    expect(
      migrateLegacyConfig({ currentTheme: "Auto Seasonal Rotate" })
        .appearanceMode
    ).toBe("auto");
  });

  it("defaults appearanceMode to auto when nothing is set", () => {
    expect(migrateLegacyConfig({}).appearanceMode).toBe("auto");
  });

  it("adds default accent colors when missing or partial", () => {
    expect(migrateLegacyConfig({}).accentColors).toEqual(DEFAULT_ACCENT);
    expect(
      migrateLegacyConfig({ accentColors: { start: "#123456" } }).accentColors
    ).toEqual(DEFAULT_ACCENT);
  });

  it("keeps existing V2 fields untouched", () => {
    const cfg = {
      appearanceMode: "dark",
      accentColors: { start: "#111111", end: "#222222" },
      workflows: { items: [] },
      language: "de",
    };
    const result = migrateLegacyConfig(cfg);
    expect(result.appearanceMode).toBe("dark");
    expect(result.accentColors).toEqual({ start: "#111111", end: "#222222" });
    expect(result.language).toBe("de");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/configMigration.test.js`
Expected: FAIL — cannot resolve `./configMigration`.

- [ ] **Step 3: Implement `configMigration.js`**

Legacy theme-id strings are inlined here on purpose — `src/constants/themeIds.js` gets deleted in Task 14 and migration must keep working afterward.

```js
import { DEFAULT_ACCENT } from "../themes/neumorphic/createNeumorphicTheme";

const LEGACY_LIGHT_THEMES = ["Light", "Flamingo", "Valentines Day"];
const LEGACY_AUTO_THEME = "Auto Seasonal Rotate";
const VALID_MODES = ["auto", "light", "dark"];

export function migrateLegacyConfig(config) {
  const result = { ...(config || {}) };

  if (!VALID_MODES.includes(result.appearanceMode)) {
    if (
      typeof result.currentTheme === "string" &&
      result.currentTheme !== LEGACY_AUTO_THEME
    ) {
      result.appearanceMode = LEGACY_LIGHT_THEMES.includes(result.currentTheme)
        ? "light"
        : "dark";
    } else {
      result.appearanceMode = "auto";
    }
  }

  if (!result.accentColors?.start || !result.accentColors?.end) {
    result.accentColors = { ...DEFAULT_ACCENT };
  }

  delete result.currentTheme;
  return result;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/services/configMigration.test.js`
Expected: PASS.

- [ ] **Step 5: Wire migration into `ReadConfigFromLocalStorage`**

In `src/services/utils.js`:
1. Remove the import of `aSuperSpecialAutoThemeSettingsId` from `../constants/themeIds`.
2. Add `import { migrateLegacyConfig } from "./configMigration";`.
3. In `ReadConfigFromLocalStorage`, remove `currentTheme: aSuperSpecialAutoThemeSettingsId,` from `defaultConfig`, and just before `return config;` add:

```js
  config = migrateLegacyConfig(config);
  window.localStorage.setItem(localStorageKey, JSON.stringify(config));
```

- [ ] **Step 6: Add slice reducers**

In `src/features/settings/settingsSlice.js`, replace the `setCurrentTheme` reducer with these two (and update the export list accordingly — remove `setCurrentTheme`, add the new ones):

```js
    setAppearanceMode: (state, action) => {
      state.config.appearanceMode = action.payload;
      WriteNewConfigToLocalStorage(state.config);
    },
    setAccentColors: (state, action) => {
      state.config.accentColors = action.payload;
      WriteNewConfigToLocalStorage(state.config);
    },
```

`setCurrentTheme` is still imported by `src/features/settings/Theming/ThemesContainer.jsx`. That whole Theming UI is replaced in Task 9; to keep the app compiling until then, edit `ThemesContainer.jsx` now so it renders `null`:

```jsx
export default function ThemesContainer() {
  return null;
}
```

(Remove its now-unused imports.)

- [ ] **Step 7: Verify, lint, commit**

Run: `npx vitest run` (all tests pass) and `npm run lint`.

```bash
git add src/services/ src/features/settings/
git commit -m "feat: add V2 config fields, migration, and appearance reducers"
```

---

### Task 4: App wiring — theme provider, mode resolution, PrideText neutralization

**Files:**
- Create: `src/themes/neumorphic/useResolvedMode.js`
- Modify: `src/App.jsx`
- Modify: `src/themes/PrideText.jsx`

**Interfaces:**
- Consumes: `createNeumorphicTheme`, config fields from Task 3.
- Produces: `useResolvedMode(appearanceMode) → 'light'|'dark'` (default export). App-wide `theme.neumorphic` availability via styled-components ThemeProvider. `PrideText` (default) and `PrideTextWithDiv` (named) keep their `{ text }` prop API but render plain text.

- [ ] **Step 1: Implement `useResolvedMode.js`**

```js
import { useEffect, useState } from "react";

const QUERY = "(prefers-color-scheme: dark)";

export default function useResolvedMode(appearanceMode) {
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia?.(QUERY).matches ?? false
  );

  useEffect(() => {
    const mq = window.matchMedia?.(QUERY);
    if (!mq) return undefined;
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (appearanceMode === "light" || appearanceMode === "dark") {
    return appearanceMode;
  }
  return systemDark ? "dark" : "light";
}
```

- [ ] **Step 2: Rewire `App.jsx`**

In `src/App.jsx`:
1. Remove imports: `GetTheme` (`./themes/ThemeProvider`), `Snowfall` (`./features/shared/Snowfall`). Add:

```js
import { useMemo } from "react";
import createNeumorphicTheme from "./themes/neumorphic/createNeumorphicTheme";
import useResolvedMode from "./themes/neumorphic/useResolvedMode";
```

2. Replace the `themeId` selector block (lines around `const themeId = useSelector(...)`) with:

```js
  const appearanceMode = useSelector(
    (state) => state.settings.config?.appearanceMode || "auto"
  );
  const accentColors = useSelector(
    (state) => state.settings.config?.accentColors
  );
  const resolvedMode = useResolvedMode(appearanceMode);
  const theme = useMemo(
    () =>
      createNeumorphicTheme(
        resolvedMode,
        accentColors?.start,
        accentColors?.end
      ),
    [resolvedMode, accentColors?.start, accentColors?.end]
  );
```

3. Replace the `document.body.style` effect with one that also maintains the PWA status-bar color:

```js
  useEffect(() => {
    document.body.style.background = theme.backgroundColor;
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", theme.backgroundColor);
  }, [theme]);
```

4. Use `<ThemeProvider theme={theme}>` and delete the `<Snowfall />` element (and its wrapping fragment).

- [ ] **Step 3: Neutralize `PrideText.jsx`**

Replace the ENTIRE content of `src/themes/PrideText.jsx` with:

```jsx
// V2: pride rainbow rendering removed with the old theme system.
// Kept as a pass-through so the ~100 call sites need no immediate change.
export default function PrideText({ text }) {
  return <>{text}</>;
}

export function PrideTextWithDiv({ text }) {
  return <div>{text}</div>;
}
```

- [ ] **Step 4: Verify in browser**

Run: `npm run dev` — open http://localhost:5173.
Expected: app renders with off-white (or anthracite, if your OS is dark) background, no rainbow text, no snow. BLE connect page loads without console errors (ignore Web-Bluetooth-unavailable warnings in unsupported browsers).
Toggle the OS color scheme (Windows: Settings → Personalization → Colors) — the app must switch live between `#e8e6e1` and `#26262b`.

- [ ] **Step 5: Lint and commit**

```bash
npm run lint
git add src/App.jsx src/themes/
git commit -m "feat: drive app theme from neumorphic factory with auto light/dark"
```

---

### Task 5: Shared neumorphic primitives

**Files:**
- Create: `src/features/shared/neumorphic/NeuCard.jsx`
- Create: `src/features/shared/neumorphic/NeuButton.jsx`
- Create: `src/features/shared/neumorphic/NeuIconButton.jsx`
- Create: `src/features/shared/neumorphic/SegmentToggle.jsx`

**Interfaces:**
- Produces (all default exports):
  - `NeuCard` — styled div; props `$inset` (pressed look), `$flat` (subtle shadow).
  - `NeuButton` — styled button; props `$primary` (gradient), `$danger` (danger bg).
  - `NeuIconButton` — styled button, circular; props `$active` (gradient fill), `$size` (CSS size, default `3.25rem`).
  - `SegmentToggle` — React component `({ options, value, onChange, ariaLabel })` where `options = [{ value, label }]`.

- [ ] **Step 1: Implement `NeuCard.jsx`**

```jsx
import styled from "styled-components";

const NeuCard = styled.div`
  background: ${(p) => p.theme.neumorphic.surface};
  border-radius: ${(p) => p.theme.neumorphic.radiusCard};
  box-shadow: ${(p) =>
    p.$inset
      ? p.theme.neumorphic.pressed
      : p.$flat
      ? p.theme.neumorphic.flat
      : p.theme.neumorphic.raised};
  padding: 1rem;
`;

export default NeuCard;
```

- [ ] **Step 2: Implement `NeuButton.jsx`**

```jsx
import styled from "styled-components";

const NeuButton = styled.button`
  border: none;
  border-radius: ${(p) => p.theme.neumorphic.radiusPill};
  min-height: 2.75rem;
  padding: 0.5rem 1.5rem;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  touch-action: manipulation;
  background: ${(p) =>
    p.$primary
      ? p.theme.neumorphic.accent.gradient
      : p.$danger
      ? p.theme.neumorphic.danger
      : p.theme.neumorphic.surface};
  color: ${(p) =>
    p.$primary
      ? p.theme.neumorphic.accent.onAccent
      : p.$danger
      ? p.theme.neumorphic.onDanger
      : p.theme.neumorphic.text};
  box-shadow: ${(p) => p.theme.neumorphic.raised};
  transition: box-shadow 0.15s ease, transform 0.15s ease;

  &:active {
    box-shadow: ${(p) => p.theme.neumorphic.pressed};
    transform: translateY(1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

export default NeuButton;
```

- [ ] **Step 3: Implement `NeuIconButton.jsx`**

```jsx
import styled from "styled-components";
import NeuButton from "./NeuButton";

const NeuIconButton = styled(NeuButton)`
  width: ${(p) => p.$size || "3.25rem"};
  height: ${(p) => p.$size || "3.25rem"};
  min-height: unset;
  padding: 0;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${(p) =>
    p.$active
      ? p.theme.neumorphic.accent.gradient
      : p.theme.neumorphic.surface};
  color: ${(p) =>
    p.$active
      ? p.theme.neumorphic.accent.onAccent
      : p.theme.neumorphic.accent.start};

  svg {
    width: 1.4rem;
    height: 1.4rem;
  }
`;

export default NeuIconButton;
```

- [ ] **Step 4: Implement `SegmentToggle.jsx`**

```jsx
import styled from "styled-components";
import PropTypes from "prop-types";

const Track = styled.div`
  display: flex;
  background: ${(p) => p.theme.neumorphic.surface};
  box-shadow: ${(p) => p.theme.neumorphic.pressed};
  border-radius: ${(p) => p.theme.neumorphic.radiusPill};
  padding: 0.3rem;
  gap: 0.25rem;
`;

const Segment = styled.button`
  flex: 1;
  border: none;
  border-radius: ${(p) => p.theme.neumorphic.radiusPill};
  padding: 0.45rem 0.9rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  touch-action: manipulation;
  background: ${(p) =>
    p.$active ? p.theme.neumorphic.accent.gradient : "transparent"};
  color: ${(p) =>
    p.$active
      ? p.theme.neumorphic.accent.onAccent
      : p.theme.neumorphic.textSecondary};
  box-shadow: ${(p) => (p.$active ? p.theme.neumorphic.raisedSmall : "none")};
  transition: background 0.2s ease, color 0.2s ease;
`;

export default function SegmentToggle({ options, value, onChange, ariaLabel }) {
  return (
    <Track role="radiogroup" aria-label={ariaLabel}>
      {options.map((option) => (
        <Segment
          key={option.value}
          role="radio"
          aria-checked={option.value === value}
          $active={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Segment>
      ))}
    </Track>
  );
}

SegmentToggle.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.node.isRequired,
    })
  ).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  ariaLabel: PropTypes.string,
};
```

- [ ] **Step 5: Lint and commit**

```bash
npm run lint
git add src/features/shared/neumorphic/
git commit -m "feat: add neumorphic UI primitives (card, buttons, segment toggle)"
```

---

### Task 6: Restyle ToggleSwitch to neumorphic pill

**Files:**
- Modify: `src/features/shared/styledComponents/Switch.jsx` (full rewrite)

**Interfaces:**
- Consumes: `theme.neumorphic` tokens.
- Produces: `ToggleSwitch` default export with the SAME external API as today: forwardRef, props `{ isToggleOn, onChange, onText, offText }`. `onText`/`offText` become an accessible label + small caption instead of in-track text. All existing callers (HeatOn, FanOn, settings toggles) keep working unchanged.

- [ ] **Step 1: Rewrite `Switch.jsx`**

Replace the entire file content with:

```jsx
import React, { useEffect, useState } from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  display: flex;
  flex-grow: 1;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  cursor: pointer;
  -webkit-user-select: none;
  user-select: none;
`;

const Track = styled.div`
  position: relative;
  width: 3.6rem;
  height: 2rem;
  flex-shrink: 0;
  border-radius: ${(p) => p.theme.neumorphic.radiusPill};
  background: ${(p) => p.theme.neumorphic.surface};
  box-shadow: ${(p) => p.theme.neumorphic.pressed};
`;

const Knob = styled.div`
  position: absolute;
  top: 0.2rem;
  left: ${(p) => (p.$on ? "1.8rem" : "0.2rem")};
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 50%;
  background: ${(p) =>
    p.$on
      ? p.theme.neumorphic.accent.gradient
      : p.theme.neumorphic.textSecondary};
  box-shadow: ${(p) => p.theme.neumorphic.raisedSmall};
  transition: left 0.25s ease, background 0.25s ease;
`;

const Caption = styled.span`
  font-size: 1.05rem;
  font-weight: 600;
  color: ${(p) =>
    p.$on ? p.theme.neumorphic.text : p.theme.neumorphic.textSecondary};
`;

const ToggleSwitch = React.forwardRef(function ToggleSwitch(
  { isToggleOn = false, onChange = () => {}, onText = "On", offText = "Off" },
  ref
) {
  const [isOn, setIsOn] = useState(isToggleOn);

  useEffect(() => {
    setIsOn(isToggleOn);
  }, [isToggleOn]);

  const handleClick = () =>
    setIsOn((oldIsOn) => {
      const nextState = !oldIsOn;
      onChange(nextState);
      return nextState;
    });

  return (
    <Wrapper
      ref={ref}
      onClick={handleClick}
      role="switch"
      aria-checked={isOn}
    >
      <Track>
        <Knob $on={isOn} />
      </Track>
      <Caption $on={isOn}>{isOn ? onText : offText}</Caption>
    </Wrapper>
  );
});

export default ToggleSwitch;
```

Note: the old file imported `GetTheme` and read Redux directly — both dependencies are gone now. There is no `defaultProps` (React 19).

- [ ] **Step 2: Verify in browser**

Run: `npm run dev`. Without a device, verify the Settings page toggles (e.g. "Turn heat on when connection is established" is only reachable when connected — instead check any toggle reachable in your flow, or temporarily open `/Volcano/Settings` directly; BLE-dependent values may be blank, the toggles must still render as neumorphic pills and animate on tap).

- [ ] **Step 3: Lint and commit**

```bash
npm run lint
git add src/features/shared/styledComponents/Switch.jsx
git commit -m "feat: restyle ToggleSwitch as neumorphic pill"
```

---

### Task 7: Floating bottom navigation

**Files:**
- Create: `src/features/shared/BottomNav/BottomNav.jsx`
- Modify: `src/features/shared/OutletRenderer/VolcanoLoader.jsx`

**Interfaces:**
- Consumes: `NeuIconButton` semantics (inline here via styled NavLink), icons from `src/features/shared/OutletRenderer/icons/`, `useTranslation`.
- Produces: `<BottomNav onDisconnect={fn} />` (default export) — fixed bottom pill bar with NavLinks to `/Volcano/App`, `/Volcano/WorkflowEditor`, `/Volcano/Settings`, `/Volcano/ContactMe` plus a disconnect button.

- [ ] **Step 1: Implement `BottomNav.jsx`**

```jsx
import { NavLink } from "react-router-dom";
import styled from "styled-components";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import ControlsIcon from "../OutletRenderer/icons/ControlsIcon";
import WorkflowEditorIcon from "../OutletRenderer/icons/WorkflowEditorIcon";
import SettingsIcon from "../OutletRenderer/icons/SettingsIcon";
import ContactMeIcon from "../OutletRenderer/icons/ContactMeIcon";
import BluetoothDisconnectIcon from "../OutletRenderer/icons/BluetoothDisconnectIcon";

const Bar = styled.nav`
  position: fixed;
  bottom: calc(0.75rem + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.6rem;
  padding: 0.55rem 0.8rem;
  border-radius: ${(p) => p.theme.neumorphic.radiusPill};
  background: ${(p) => p.theme.neumorphic.surface};
  box-shadow: ${(p) => p.theme.neumorphic.raised};
  z-index: 1000;
`;

const itemStyles = `
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 50%;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  touch-action: manipulation;
`;

const Item = styled(NavLink)`
  ${itemStyles}
  background: ${(p) => p.theme.neumorphic.surface};
  color: ${(p) => p.theme.neumorphic.textSecondary};
  box-shadow: none;

  &.active {
    background: ${(p) => p.theme.neumorphic.accent.gradient};
    color: ${(p) => p.theme.neumorphic.accent.onAccent};
    box-shadow: ${(p) => p.theme.neumorphic.raisedSmall};
  }

  svg {
    width: 1.4rem;
    height: 1.4rem;
  }
`;

const DisconnectButton = styled.button`
  ${itemStyles}
  background: ${(p) => p.theme.neumorphic.surface};
  color: ${(p) => p.theme.neumorphic.danger};
  box-shadow: none;

  &:active {
    box-shadow: ${(p) => p.theme.neumorphic.pressed};
  }

  svg {
    width: 1.4rem;
    height: 1.4rem;
  }
`;

export default function BottomNav({ onDisconnect }) {
  const { t } = useTranslation();
  return (
    <Bar>
      <Item to="/Volcano/App" aria-label={t("navigation.controls")}>
        <ControlsIcon />
      </Item>
      <Item
        to="/Volcano/WorkflowEditor"
        aria-label={t("navigation.workflowEditor")}
      >
        <WorkflowEditorIcon />
      </Item>
      <Item to="/Volcano/Settings" aria-label={t("navigation.settings")}>
        <SettingsIcon />
      </Item>
      <Item to="/Volcano/ContactMe" aria-label={t("navigation.contactMe")}>
        <ContactMeIcon />
      </Item>
      <DisconnectButton
        onClick={onDisconnect}
        aria-label={t("navigation.disconnect")}
      >
        <BluetoothDisconnectIcon />
      </DisconnectButton>
    </Bar>
  );
}

BottomNav.propTypes = { onDisconnect: PropTypes.func.isRequired };
```

Note: the icon components may render their own text/size wrappers — check `src/features/shared/OutletRenderer/icons/Shared/` and, if an icon renders a label div, use the raw SVG part only (adjust the icon import to whatever exposes the bare SVG; if none does, wrap with a `div { display: contents }` and hide text via `span { display: none }` inside `Item`). Verify visually.

- [ ] **Step 2: Replace the navbar in `VolcanoLoader.jsx`**

In `src/features/shared/OutletRenderer/VolcanoLoader.jsx`:
1. Delete imports: `Navbar`, `Nav`, `Container` (react-bootstrap), `MenuBarIcon`, `StyledRouterIconLink` usage for nav, `feastOfSaintPatrickId`. Add `import BottomNav from "../BottomNav/BottomNav";`.
2. Delete the styled components `StyledNavBar`, `StyledNavBarToggle`, `StyledNav`, `WhiteMenuIconWrapper` and the `expanded` state + `navBarToggleOnClick`/`onLinkClick` handlers. KEEP all BLE `useEffect` blocks, `OnDisconnectClick`, and `readFOrCToStore` exactly as they are.
3. Replace `outletStyling` with (drop the St. Patrick zIndex):

```js
  const outletStyling = {
    display: "flex",
    justifyContent: "space-between",
    flexGrow: "1",
  };
```

4. Replace the returned JSX with a slim header + bottom nav:

```jsx
  return (
    <MainWrapper>
      <Header>
        <BrandLink to="/Volcano/App">Project Onyx</BrandLink>
        <AutoOff style={{ marginLeft: "10px" }} />
        <CurrentWorkflowExecutionDisplay />
      </Header>

      <ContentWrapper>
        <ScrollingDiv className="main-div">
          <div style={outletStyling}>
            <Outlet {...props} />
          </div>
        </ScrollingDiv>
      </ContentWrapper>

      <BottomNav onDisconnect={OnDisconnectClick} />
    </MainWrapper>
  );
```

with new styled components (add near the top of the file; `Link` from react-router-dom):

```jsx
const Header = styled.div`
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem 0.25rem;
  flex-shrink: 0;
`;

const BrandLink = styled(Link)`
  font-weight: 700;
  font-size: 1.1rem;
  text-decoration: none;
  color: ${(p) => p.theme.neumorphic.text};
`;
```

5. Give the scroll content room above the floating bar — extend the existing `ContentWrapper` styled component with `padding-bottom: 5.5rem;`.
6. The "Mini Mode" nav entry is gone; verify `src/features/settings/Settings.jsx` renders `MinimalistModeToggle` (from `src/features/shared/MinimalistModeToggle.jsx`) in the Behavior section — if it does not, add it there.
7. `useTheme` and `PrideTextWithDiv` imports may now be unused in this file — remove any unused imports.

- [ ] **Step 3: Verify in browser**

Run: `npm run dev`, navigate to `/Volcano/Settings` (dev server; BLE-dependent widgets may be empty).
Expected: floating pill bar fixed at bottom center with 5 round items; active route's icon has the gradient circle; content scrolls behind but never hides under the bar; works at 375px width (mobile viewport in devtools).

- [ ] **Step 4: Lint and commit**

```bash
npm run lint
git add src/features/shared/
git commit -m "feat: replace bootstrap navbar with floating neumorphic bottom nav"
```

---

### Task 8: Temperature dial (math + component + integration)

**Files:**
- Create: `src/features/deviceInteraction/TemperatureDial/dialMath.js`
- Test: `src/features/deviceInteraction/TemperatureDial/dialMath.test.js`
- Create: `src/features/deviceInteraction/TemperatureDial/TemperatureDial.jsx`
- Create: `src/features/deviceInteraction/TemperatureDial/TemperatureDialContainer.jsx`
- Modify: `src/features/deviceInteraction/DeviceInteraction.jsx`

**Interfaces:**
- Consumes: `getDisplayTemperature`, `convertToUInt32BLE`, `convertToUInt8BLE` from `src/services/utils.js`; `MIN_CELSIUS_TEMP`, `MAX_CELSIUS_TEMP` from `src/constants/temperature.js`; BLE plumbing from `src/services/BleCharacteristicCache.js` + `src/services/bleQueueing.js`; Redux `deviceInteractionSlice` actions.
- Produces:
  - `dialMath.js` named exports: `DIAL_START_ANGLE = -135`, `DIAL_SWEEP = 270`, `clamp(v, min, max)`, `tempToAngle(temp, minTemp, maxTemp) → deg`, `angleToTemp(angle, minTemp, maxTemp) → rounded °C`, `polarToCartesian(cx, cy, r, angleDeg) → {x, y}` (0° = 12 o'clock, clockwise positive), `describeArc(cx, cy, r, startAngle, endAngle) → SVG path string`, `pointerToAngle(cx, cy, x, y) → clamped deg`.
  - `TemperatureDial` (default export): props `{ currentTemperature, targetTemperature, isF, isHeatOn, onTargetCommit, onCenterClick, compact }` — temperatures in °C; `onTargetCommit(celsius)` fires ONCE on drag release; `compact` renders a smaller dial without the target caption (used by MinimalistLayout in Task 13).
  - `TemperatureDialContainer` (default export): no props; owns current-temperature BLE subscription and commit-write.

- [ ] **Step 1: Write the failing dialMath test**

```js
import { describe, it, expect } from "vitest";
import {
  DIAL_START_ANGLE,
  DIAL_SWEEP,
  clamp,
  tempToAngle,
  angleToTemp,
  polarToCartesian,
  describeArc,
  pointerToAngle,
} from "./dialMath";

describe("tempToAngle / angleToTemp", () => {
  it("min temp maps to start angle", () => {
    expect(tempToAngle(40, 40, 230)).toBe(DIAL_START_ANGLE);
  });
  it("max temp maps to end angle", () => {
    expect(tempToAngle(230, 40, 230)).toBe(DIAL_START_ANGLE + DIAL_SWEEP);
  });
  it("angleToTemp inverts tempToAngle", () => {
    expect(angleToTemp(tempToAngle(180, 40, 230), 40, 230)).toBe(180);
  });
  it("angleToTemp clamps outside the sweep", () => {
    expect(angleToTemp(-500, 40, 230)).toBe(40);
    expect(angleToTemp(500, 40, 230)).toBe(230);
  });
});

describe("clamp", () => {
  it("clamps both ends", () => {
    expect(clamp(5, 10, 20)).toBe(10);
    expect(clamp(25, 10, 20)).toBe(20);
    expect(clamp(15, 10, 20)).toBe(15);
  });
});

describe("polarToCartesian (0° = 12 o'clock, clockwise)", () => {
  it("0° points straight up", () => {
    const p = polarToCartesian(100, 100, 50, 0);
    expect(p.x).toBeCloseTo(100);
    expect(p.y).toBeCloseTo(50);
  });
  it("90° points right", () => {
    const p = polarToCartesian(100, 100, 50, 90);
    expect(p.x).toBeCloseTo(150);
    expect(p.y).toBeCloseTo(100);
  });
});

describe("describeArc", () => {
  it("produces an SVG arc path", () => {
    expect(describeArc(130, 130, 110, -135, 135)).toMatch(/^M .* A /);
  });
});

describe("pointerToAngle", () => {
  it("top of the circle is 0°", () => {
    expect(pointerToAngle(100, 100, 100, 40)).toBeCloseTo(0);
  });
  it("right of the circle is 90°", () => {
    expect(pointerToAngle(100, 100, 160, 100)).toBeCloseTo(90);
  });
  it("clamps into the dial sweep", () => {
    // straight down (180°) is in the dial's gap → clamps to ±135
    const angle = pointerToAngle(100, 100, 100, 160);
    expect(Math.abs(angle)).toBeCloseTo(135);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/deviceInteraction/TemperatureDial/dialMath.test.js`
Expected: FAIL — cannot resolve `./dialMath`.

- [ ] **Step 3: Implement `dialMath.js`**

```js
export const DIAL_START_ANGLE = -135;
export const DIAL_SWEEP = 270;

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function tempToAngle(temp, minTemp, maxTemp) {
  const fraction = (clamp(temp, minTemp, maxTemp) - minTemp) / (maxTemp - minTemp);
  return DIAL_START_ANGLE + fraction * DIAL_SWEEP;
}

export function angleToTemp(angle, minTemp, maxTemp) {
  const clamped = clamp(angle, DIAL_START_ANGLE, DIAL_START_ANGLE + DIAL_SWEEP);
  const fraction = (clamped - DIAL_START_ANGLE) / DIAL_SWEEP;
  return Math.round(minTemp + fraction * (maxTemp - minTemp));
}

export function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

export function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

export function pointerToAngle(cx, cy, x, y) {
  const angle = (Math.atan2(x - cx, cy - y) * 180) / Math.PI;
  return clamp(angle, DIAL_START_ANGLE, DIAL_START_ANGLE + DIAL_SWEEP);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/deviceInteraction/TemperatureDial/dialMath.test.js`
Expected: PASS.

- [ ] **Step 5: Implement `TemperatureDial.jsx`**

```jsx
import { useId, useRef, useState } from "react";
import styled, { keyframes, css, useTheme } from "styled-components";
import PropTypes from "prop-types";
import {
  MIN_CELSIUS_TEMP,
  MAX_CELSIUS_TEMP,
} from "../../../constants/temperature";
import { getDisplayTemperature } from "../../../services/utils";
import {
  DIAL_START_ANGLE,
  DIAL_SWEEP,
  tempToAngle,
  angleToTemp,
  polarToCartesian,
  describeArc,
  pointerToAngle,
} from "./dialMath";

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
`;

const DialWrapper = styled.div`
  position: relative;
  width: ${(p) => (p.$compact ? "min(60vw, 15rem)" : "min(80vw, 20rem)")};
  margin: 0 auto;
  border-radius: 50%;
  box-shadow: ${(p) => p.theme.neumorphic.raised};
  background: ${(p) => p.theme.neumorphic.surface};
  touch-action: none;
`;

const ProgressArc = styled.path`
  ${(p) =>
    p.$pulsing &&
    css`
      animation: ${pulse} 1.6s ease-in-out infinite;
    `}
`;

const CenterText = styled.text`
  fill: ${(p) => p.theme.neumorphic.text};
  font-size: 44px;
  font-weight: 700;
`;

const TargetText = styled.text`
  fill: ${(p) => p.theme.neumorphic.textSecondary};
  font-size: 18px;
  font-weight: 600;
`;

const SIZE = 260;
const CENTER = SIZE / 2;
const RADIUS = 110;
const STROKE = 16;

export default function TemperatureDial({
  currentTemperature,
  targetTemperature,
  isF,
  isHeatOn,
  onTargetCommit,
  onCenterClick,
  compact = false,
}) {
  const theme = useTheme();
  const gradientId = useId();
  const svgRef = useRef(null);
  const [dragTemp, setDragTemp] = useState(null);

  const displayTarget = dragTemp ?? targetTemperature ?? MIN_CELSIUS_TEMP;
  const targetAngle = tempToAngle(
    displayTarget,
    MIN_CELSIUS_TEMP,
    MAX_CELSIUS_TEMP
  );
  const handlePos = polarToCartesian(CENTER, CENTER, RADIUS, targetAngle);

  const eventToTemp = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const scale = SIZE / rect.width;
    const x = (e.clientX - rect.left) * scale;
    const y = (e.clientY - rect.top) * scale;
    const angle = pointerToAngle(CENTER, CENTER, x, y);
    return angleToTemp(angle, MIN_CELSIUS_TEMP, MAX_CELSIUS_TEMP);
  };

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragTemp(eventToTemp(e));
  };

  const onPointerMove = (e) => {
    if (dragTemp === null) return;
    setDragTemp(eventToTemp(e));
  };

  const onPointerUp = () => {
    if (dragTemp === null) return;
    onTargetCommit(dragTemp);
    setDragTemp(null);
  };

  const showCurrent =
    (!isNaN(parseInt(currentTemperature)) &&
      currentTemperature > MIN_CELSIUS_TEMP &&
      currentTemperature <= MAX_CELSIUS_TEMP) ||
    isHeatOn;

  return (
    <DialWrapper $compact={compact}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ display: "block", width: "100%" }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={theme.neumorphic.accent.start} />
            <stop offset="100%" stopColor={theme.neumorphic.accent.end} />
          </linearGradient>
        </defs>

        {/* full track */}
        <path
          d={describeArc(
            CENTER,
            CENTER,
            RADIUS,
            DIAL_START_ANGLE,
            DIAL_START_ANGLE + DIAL_SWEEP
          )}
          fill="none"
          stroke={theme.neumorphic.shadowDark}
          strokeOpacity="0.45"
          strokeWidth={STROKE}
          strokeLinecap="round"
        />

        {/* progress to target */}
        <ProgressArc
          $pulsing={isHeatOn}
          d={describeArc(CENTER, CENTER, RADIUS, DIAL_START_ANGLE, targetAngle)}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={STROKE}
          strokeLinecap="round"
        />

        {/* drag handle */}
        <circle
          cx={handlePos.x}
          cy={handlePos.y}
          r="13"
          fill={theme.neumorphic.surface}
          stroke={theme.neumorphic.accent.end}
          strokeWidth="4"
        />

        {/* invisible fat hit ring for touch */}
        <path
          d={describeArc(
            CENTER,
            CENTER,
            RADIUS,
            DIAL_START_ANGLE,
            DIAL_START_ANGLE + DIAL_SWEEP
          )}
          fill="none"
          stroke="transparent"
          strokeWidth="44"
          style={{ cursor: "pointer" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />

        <CenterText
          x={CENTER}
          y={compact ? CENTER + 14 : CENTER + 4}
          textAnchor="middle"
          opacity={showCurrent ? 1 : 0.25}
          style={{ cursor: onCenterClick ? "pointer" : "default" }}
          onClick={onCenterClick}
        >
          {getDisplayTemperature(currentTemperature ?? 0, isF)}
        </CenterText>
        {!compact && (
          <TargetText x={CENTER} y={CENTER + 34} textAnchor="middle">
            {getDisplayTemperature(displayTarget, isF)}
          </TargetText>
        )}
      </svg>
    </DialWrapper>
  );
}

TemperatureDial.propTypes = {
  currentTemperature: PropTypes.number,
  targetTemperature: PropTypes.number,
  isF: PropTypes.bool,
  isHeatOn: PropTypes.bool,
  onTargetCommit: PropTypes.func.isRequired,
  onCenterClick: PropTypes.func,
  compact: PropTypes.bool,
};
```

- [ ] **Step 6: Implement `TemperatureDialContainer.jsx`**

This container takes over the responsibilities of `CurrentTemperatureContainer.jsx` (which leaves the tree in Step 7). Move BOTH `useEffect` blocks and `handleTemperatureUnitToggle` from `src/features/deviceInteraction/CurrentTemperature/CurrentTemperatureContainer.jsx` into it VERBATIM (same imports: `currentTemperatureUuid`, `register2Uuid`, masks, `AddToQueue`, `AddToPriorityQueue`, `store`, `setCurrentTemperature`, `setIsF`). Then add the commit handler:

```jsx
import { useDispatch, useSelector } from "react-redux";
import TemperatureDial from "./TemperatureDial";
import { getCharacteristic } from "../../../services/BleCharacteristicCache";
import { writeTemperatureUuid, heatOnUuid } from "../../../constants/uuids";
import { AddToQueue, AddToPriorityQueue } from "../../../services/bleQueueing";
import {
  convertToUInt32BLE,
  convertToUInt8BLE,
} from "../../../services/utils";
import {
  setTargetTemperature,
  setIsHeatOn,
} from "../deviceInteractionSlice";
// ...plus the imports required by the moved effects (see above)

export default function TemperatureDialContainer() {
  const dispatch = useDispatch();
  const isF = useSelector((state) => state.settings.isF);
  const isHeatOn = useSelector((state) => state.deviceInteraction.isHeatOn);
  const currentTemperature = useSelector(
    (state) => state.deviceInteraction.currentTemperature
  );
  const targetTemperature = useSelector(
    (state) => state.deviceInteraction.targetTemperature
  );

  // <the two moved useEffect blocks from CurrentTemperatureContainer go here>
  // <the moved handleTemperatureUnitToggle goes here>

  const onTargetCommit = (celsius) => {
    dispatch(setTargetTemperature(celsius));
    const blePayload = async () => {
      const characteristic = getCharacteristic(writeTemperatureUuid);
      const buffer = convertToUInt32BLE(celsius * 10);
      await characteristic.writeValue(buffer);
    };
    AddToQueue(blePayload);

    if (!isHeatOn) {
      const heatPayload = async () => {
        const characteristic = getCharacteristic(heatOnUuid);
        const buffer = convertToUInt8BLE(0);
        await characteristic.writeValue(buffer);
        dispatch(setIsHeatOn(true));
      };
      AddToPriorityQueue(heatPayload);
    }
  };

  return (
    <TemperatureDial
      currentTemperature={currentTemperature}
      targetTemperature={targetTemperature}
      isF={isF}
      isHeatOn={isHeatOn}
      onTargetCommit={onTargetCommit}
      onCenterClick={handleTemperatureUnitToggle}
    />
  );
}
```

The BLE write pattern (temp × 10 as UInt32, heat-on via priority queue) mirrors `TargetTemperatureRange.jsx` exactly. Writes happen only in `onTargetCommit` (pointer release) — never during drag.

- [ ] **Step 7: Integrate into `DeviceInteraction.jsx`**

Replace the file content with:

```jsx
import HeatOn from "./HeatOn/HeatOnContainer";
import FanOn from "./FanOn/FanOnContainer";
import WriteTemperature from "./WriteTemperature/WriteTemperatureContainer";
import TemperatureDialContainer from "./TemperatureDial/TemperatureDialContainer";
import WorkFlow from "../workflowEditor/WorkflowButtons";
import Container from "react-bootstrap/Container";
import styled from "styled-components";

const Div = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 1.25rem;
  padding: 1rem 0 2rem;
`;

const ToggleRow = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
`;

function Volcano() {
  return (
    <Container style={{ display: "flex" }}>
      <Div>
        <ToggleRow className="heat-air-div">
          <HeatOn />
          <FanOn />
        </ToggleRow>
        <TemperatureDialContainer />
        <WriteTemperature />
        <WorkFlow />
      </Div>
    </Container>
  );
}

export default Volcano;
```

`CurrentTemperature`, `CurrentTargetTemperature`, and `TargetTemperatureRange` leave the tree (their BLE duties are covered by `TemperatureDialContainer` + the untouched `WriteTemperatureContainer`). Do NOT delete their files yet (Task 14). Check `src/features/shared/OutletRenderer/Volcano.css` for `.heat-air-div` rules that conflict with the new layout and trim only what breaks it.

- [ ] **Step 8: Restyle preset buttons as chips**

In `src/features/deviceInteraction/WriteTemperature/styledComponents.jsx`, the buttons already read theme values that the factory now feeds. Update the base `InactiveButton` to use neumorphic tokens (keep exports and names identical):

```js
export const InactiveButton = styled.button`
  font-size: 1.1rem;
  min-height: 2.75rem;
  flex-grow: 1;
  border: none;
  border-radius: ${(props) => props.theme.neumorphic.radiusPill};
  background: ${(props) => props.theme.neumorphic.surface};
  color: ${(props) => props.theme.neumorphic.text};
  box-shadow: ${(props) => props.theme.neumorphic.raisedSmall};
  transition: box-shadow 0.15s ease, transform 0.15s ease;
  touch-action: manipulation;

  &:active {
    box-shadow: ${(props) => props.theme.neumorphic.pressed};
    transform: translateY(1px);
  }
`;

export const GlowyInactiveButton = styled(InactiveButton)`
  box-shadow: ${(props) => props.theme.neumorphic.raisedSmall},
    0 0 10px ${(props) => props.theme.neumorphic.accent.start};
`;

export const ActiveButton = styled(InactiveButton)`
  background: ${(props) => props.theme.neumorphic.accent.gradient};
  color: ${(props) => props.theme.neumorphic.accent.onAccent};
`;

export const PlusMinusButton = styled(InactiveButton)``;
```

(Keep the existing `Div` export unchanged.)

- [ ] **Step 9: Run all tests + verify in browser**

Run: `npx vitest run` — all pass. `npm run dev`:
- Dial renders centered, gradient arc from bottom-left, handle dot at target angle.
- Devtools mobile emulation: drag the ring — target readout follows the finger, no BLE errors on release (without a device the queued write fails silently in console — acceptable in dev).
- +/− and preset chips render as pills; active preset shows the gradient.

- [ ] **Step 10: Lint and commit**

```bash
npm run lint
git add src/features/deviceInteraction/
git commit -m "feat: add interactive circular temperature dial"
```

---

### Task 9: Appearance settings (mode toggle + accent color editor)

**Files:**
- Create: `src/features/settings/Appearance/AppearanceSettings.jsx`
- Modify: `src/features/settings/Settings.jsx` (swap ThemesContainer → AppearanceSettings)
- Modify: all 7 `src/i18n/*/translation.json`
- Delete usage (file stays until Task 14): `src/features/settings/Theming/`

**Interfaces:**
- Consumes: `setAppearanceMode`, `setAccentColors` (Task 3), `SegmentToggle`, `NeuButton`, `NeuCard` (Task 5), `ACCENT_PRESETS`, `DEFAULT_ACCENT` (Task 2).
- Produces: `AppearanceSettings` default export, no props.

- [ ] **Step 1: Add i18n keys**

Add to `src/i18n/en/translation.json` under a new top-level `"appearance"` key (respect existing JSON structure — merge, don't overwrite):

```json
"appearance": {
  "title": "Appearance",
  "mode": "Mode",
  "light": "Light",
  "dark": "Dark",
  "auto": "Auto",
  "accentColors": "Accent colors",
  "startColor": "Start color",
  "endColor": "End color",
  "presets": "Presets",
  "reset": "Reset colors",
  "preview": "Preview"
}
```

German (`de/translation.json`):

```json
"appearance": {
  "title": "Erscheinungsbild",
  "mode": "Modus",
  "light": "Hell",
  "dark": "Dunkel",
  "auto": "Auto",
  "accentColors": "Akzentfarben",
  "startColor": "Startfarbe",
  "endColor": "Endfarbe",
  "presets": "Vorlagen",
  "reset": "Farben zurücksetzen",
  "preview": "Vorschau"
}
```

Copy the English block into `fr`, `es`, `pl`, `binary`, `elvish` translation files (translated values optional; keys are mandatory so no raw keys render).

- [ ] **Step 2: Implement `AppearanceSettings.jsx`**

```jsx
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import SegmentToggle from "../../shared/neumorphic/SegmentToggle";
import NeuButton from "../../shared/neumorphic/NeuButton";
import { setAppearanceMode, setAccentColors } from "../settingsSlice";
import { ACCENT_PRESETS } from "../../../themes/neumorphic/presets";
import { DEFAULT_ACCENT } from "../../../themes/neumorphic/createNeumorphicTheme";

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Label = styled.div`
  font-weight: 600;
  color: ${(p) => p.theme.neumorphic.textSecondary};
  font-size: 0.9rem;
`;

const PreviewRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const PreviewRing = styled.div`
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: ${(p) => p.theme.neumorphic.accent.gradient};
  box-shadow: ${(p) => p.theme.neumorphic.raisedSmall};
`;

const ColorRow = styled.div`
  display: flex;
  gap: 1rem;
`;

const ColorField = styled.label`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.9rem;
  color: ${(p) => p.theme.neumorphic.textSecondary};

  input[type="color"] {
    width: 100%;
    height: 3rem;
    border: none;
    border-radius: 12px;
    background: ${(p) => p.theme.neumorphic.surface};
    box-shadow: ${(p) => p.theme.neumorphic.pressed};
    padding: 0.4rem;
    cursor: pointer;
  }
`;

const PresetRow = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const PresetDot = styled.button`
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background: linear-gradient(135deg, ${(p) => p.$start}, ${(p) => p.$end});
  box-shadow: ${(p) => p.theme.neumorphic.raisedSmall};

  &:active {
    box-shadow: ${(p) => p.theme.neumorphic.pressed};
  }
`;

export default function AppearanceSettings() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const mode = useSelector(
    (state) => state.settings.config?.appearanceMode || "auto"
  );
  const accent = useSelector(
    (state) => state.settings.config?.accentColors || DEFAULT_ACCENT
  );

  const onColorChange = (key) => (e) =>
    dispatch(setAccentColors({ ...accent, [key]: e.target.value }));

  return (
    <Section>
      <Label>{t("appearance.mode")}</Label>
      <SegmentToggle
        ariaLabel={t("appearance.mode")}
        value={mode}
        onChange={(value) => dispatch(setAppearanceMode(value))}
        options={[
          { value: "light", label: t("appearance.light") },
          { value: "dark", label: t("appearance.dark") },
          { value: "auto", label: t("appearance.auto") },
        ]}
      />

      <Label>{t("appearance.accentColors")}</Label>
      <PreviewRow>
        <PreviewRing aria-hidden="true" />
        <NeuButton $primary type="button">
          {t("appearance.preview")}
        </NeuButton>
      </PreviewRow>

      <ColorRow>
        <ColorField>
          {t("appearance.startColor")}
          <input
            type="color"
            value={accent.start}
            onChange={onColorChange("start")}
          />
        </ColorField>
        <ColorField>
          {t("appearance.endColor")}
          <input
            type="color"
            value={accent.end}
            onChange={onColorChange("end")}
          />
        </ColorField>
      </ColorRow>

      <Label>{t("appearance.presets")}</Label>
      <PresetRow>
        {ACCENT_PRESETS.map((preset) => (
          <PresetDot
            key={preset.id}
            $start={preset.start}
            $end={preset.end}
            aria-label={preset.id}
            onClick={() =>
              dispatch(
                setAccentColors({ start: preset.start, end: preset.end })
              )
            }
          />
        ))}
      </PresetRow>

      <NeuButton
        type="button"
        onClick={() => dispatch(setAccentColors({ ...DEFAULT_ACCENT }))}
      >
        {t("appearance.reset")}
      </NeuButton>
    </Section>
  );
}
```

- [ ] **Step 3: Swap into `Settings.jsx`**

In `src/features/settings/Settings.jsx`: replace the import of `ThemesContainer` (path `./Theming/ThemesContainer`) with `import AppearanceSettings from "./Appearance/AppearanceSettings";` and replace its JSX usage inside the Appearance section with `<AppearanceSettings />`. Use the existing section-title translation or `t("appearance.title")` — keep whatever heading pattern `Settings.jsx` already uses for its sections.

- [ ] **Step 4: Verify in browser**

`npm run dev` → `/Volcano/Settings`:
- Mode toggle: tapping Hell/Dunkel/Auto instantly re-themes the whole app and survives a reload (localStorage).
- Color pickers update the gradient live (buttons, dial on the controls page).
- Preset dots apply pairs; Reset restores orange→pink.
- Extreme test: pick surface-colored accents (`#e8e6e1` on light mode) — controls must stay visible (contrast guard).

- [ ] **Step 5: Lint, test, commit**

```bash
npm run lint && npx vitest run
git add src/features/settings/ src/i18n/
git commit -m "feat: add appearance settings with mode toggle and accent color editor"
```

---

### Task 10: Settings screen restyle

**Files:**
- Modify: `src/features/settings/SettingsSection.jsx`
- Modify: `src/features/settings/Shared/SettingsRange/SettingsRange.jsx`
- Modify: `src/features/settings/Shared/StyledComponents/Div.jsx`, `StyledToggleDiv.jsx` (only if their colors clash — check first)
- Modify: `src/features/settings/InstallPWA/PWAInstall.jsx` (button styling only)

**Interfaces:**
- Consumes: `NeuCard`, `NeuButton`, `theme.neumorphic` tokens.
- Produces: no API changes anywhere — visual only.

- [ ] **Step 1: Restyle `SettingsSection.jsx`**

Read the file first. Convert its outer container to `NeuCard` semantics (either import `NeuCard` and wrap, or apply the same tokens to its existing styled component):

```js
  background: ${(p) => p.theme.neumorphic.surface};
  border-radius: ${(p) => p.theme.neumorphic.radiusCard};
  box-shadow: ${(p) => p.theme.neumorphic.raised};
  border: none;
  margin-bottom: 1.25rem;
  overflow: hidden;
```

The clickable section header gets `color: theme.neumorphic.text`, padding `1rem 1.25rem`, and the expanded body an inset top divider: `border-top: 1px solid ${(p) => p.theme.neumorphic.shadowDark}`.

- [ ] **Step 2: Restyle `SettingsRange.jsx`**

Read the file; if it uses a native `<input type="range">`, style it:

```js
const RangeInput = styled.input`
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: ${(p) => p.theme.neumorphic.accent.gradient};
  box-shadow: ${(p) => p.theme.neumorphic.pressed};
  outline: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: ${(p) => p.theme.neumorphic.surface};
    box-shadow: ${(p) => p.theme.neumorphic.raisedSmall};
    border: 3px solid ${(p) => p.theme.neumorphic.accent.end};
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: ${(p) => p.theme.neumorphic.surface};
    box-shadow: ${(p) => p.theme.neumorphic.raisedSmall};
    border: 3px solid ${(p) => p.theme.neumorphic.accent.end};
    cursor: pointer;
  }
`;
```

If it uses `react-range` instead, apply the same colors to its `renderTrack`/`renderThumb`.

- [ ] **Step 3: PWA install button**

In `PWAInstall.jsx`, swap its button element/styled-component for `NeuButton` with `$primary` (import from `../../shared/neumorphic/NeuButton`). Do not touch the `beforeinstallprompt` logic or `usePWAInstallAvailable`.

- [ ] **Step 4: Sweep the remaining settings widgets**

Open each of: `AdjustAutoShutoffTimeContainer.jsx`, `AdjustLEDbrightnessContainer.jsx`, `FOrC/FOrC.jsx`, `LanguageSelector.jsx`, `TemperatureControlValues/*.jsx`, `DeviceInformation/DeviceInfoCard.jsx`. Rule: any hardcoded colors or old theme keys used for backgrounds/borders get replaced with `theme.neumorphic.surface` / `theme.neumorphic.text` / shadow tokens; buttons become `NeuButton` (danger variants `$danger`); selects (`FormSelect`) get `background: theme.neumorphic.surface; color: theme.neumorphic.text; border: none; box-shadow: theme.neumorphic.pressed; border-radius: 12px;`. No logic changes.

- [ ] **Step 5: Verify in browser (light AND dark)**

`/Volcano/Settings` in both modes: cards raised, toggles pill-style, sliders gradient-filled, no unreadable text, no leftover green/red bootstrap toggle colors. Mobile viewport: no horizontal scroll.

- [ ] **Step 6: Lint and commit**

```bash
npm run lint
git add src/features/settings/ src/features/deviceInformation/
git commit -m "feat: restyle settings screen with neumorphic components"
```

---

### Task 11: BLE connect screen

**Files:**
- Modify: `src/features/deviceBLEconnection/Ble.jsx` (and `LoadingConnection.jsx` if it renders the spinner)

**Interfaces:**
- Consumes: `theme.neumorphic`, `NeuCard`.
- Produces: no API change; connect handler stays as-is.

- [ ] **Step 1: Restyle the connect screen**

Read `Ble.jsx` first. Keep ALL connection logic (device request, error branches, iOS hint). Replace the visual shell with:

```jsx
const ConnectWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  flex-grow: 1;
  padding: 2rem 1rem;
`;

const AppTitle = styled.h1`
  font-size: 1.6rem;
  font-weight: 700;
  color: ${(p) => p.theme.neumorphic.text};
`;
```

Use this concrete connect button (pulse ring while `$connecting`):

```jsx
const ConnectButton = styled.button`
  width: 11rem;
  height: 11rem;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  font-weight: 700;
  background: ${(p) => p.theme.neumorphic.accent.gradient};
  color: ${(p) => p.theme.neumorphic.accent.onAccent};
  box-shadow: ${(p) => p.theme.neumorphic.raised};
  transition: transform 0.15s ease;

  &:active {
    transform: scale(0.97);
    box-shadow: ${(p) => p.theme.neumorphic.pressed};
  }

  ${(p) =>
    p.$connecting &&
    css`
      animation: ${connectPulse} 1.8s ease-in-out infinite;
    `}
`;

const connectPulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
`;
```

(Define `connectPulse` before `ConnectButton`.) Status/error text sits below the button; error states render inside a `NeuCard` (`$flat`) with the existing iOS/WebBLE hint text unchanged. Keep the Patreon component wherever it currently renders.

- [ ] **Step 2: Verify in browser**

`/` shows title + big round gradient button centered; clicking it opens the browser BLE picker (or the existing unsupported-browser message). Both modes readable.

- [ ] **Step 3: Lint and commit**

```bash
npm run lint
git add src/features/deviceBLEconnection/
git commit -m "feat: restyle BLE connect screen"
```

---

### Task 12: Workflow editor restyle

**Files:**
- Modify: `src/features/workflowEditor/WorkflowEditor.jsx` (styled components only)
- Modify: `src/features/workflowEditor/shared/WorkflowItemDiv.jsx`, `WorkflowFooterButtons.jsx`
- Modify: `src/features/shared/styledComponents/Button.jsx`, `FormControl.jsx`, `Modal.jsx`

**Interfaces:**
- Consumes: `theme.neumorphic`, `NeuButton`.
- Produces: no API changes; react-dnd untouched.

- [ ] **Step 1: Restyle shared Button/FormControl/Modal**

`Button.jsx`: re-export or restyle to `NeuButton` tokens (keep the export name/default used by callers — read the file first). `FormControl.jsx` (styled react-bootstrap FormControl): `background: theme.neumorphic.surface; color: theme.neumorphic.text; border: none; box-shadow: theme.neumorphic.pressed; border-radius: 12px;` plus a `:focus` state `box-shadow: pressed, 0 0 0 2px accent.tint`. `Modal.jsx`: `.modal-content { background: surface; color: text; border: none; border-radius: radiusCard; box-shadow: raised; }`.

- [ ] **Step 2: Restyle the accordion**

In `WorkflowEditor.jsx` locate the styled wrappers (`AccordionItemWrapper`, `ConfigCard`, `WorkflowCreationCard`, etc. — read the file) and apply: items = raised cards (`surface`, `radiusCard`, `raised`, `border: none`, `margin-bottom: 1rem`), react-bootstrap accordion overrides:

```js
  .accordion-item {
    background: ${(p) => p.theme.neumorphic.surface};
    border: none;
    border-radius: ${(p) => p.theme.neumorphic.radiusCard};
    box-shadow: ${(p) => p.theme.neumorphic.raised};
    overflow: hidden;
  }
  .accordion-button {
    background: ${(p) => p.theme.neumorphic.surface};
    color: ${(p) => p.theme.neumorphic.text};
    font-weight: 600;
    box-shadow: none;
  }
  .accordion-button:not(.collapsed) {
    background: ${(p) => p.theme.workflowEditor.accordionExpandedColor};
    color: ${(p) => p.theme.neumorphic.text};
  }
  .accordion-body {
    box-shadow: ${(p) => p.theme.neumorphic.pressed};
    background: ${(p) => p.theme.neumorphic.surface};
  }
`;
```

Primary actions (save/create) → `NeuButton $primary`; delete buttons → `$danger`; import/export/secondary → plain `NeuButton`. Drag handles keep their DOM structure (react-dnd refs!), only colors/shadows change.

- [ ] **Step 3: Verify in browser**

`/Volcano/WorkflowEditor`: accordion cards raised, expanding shows inset body, drag & drop still reorders items (test with mouse AND touch emulation), JSON import/export cards restyled, both modes readable.

- [ ] **Step 4: Lint and commit**

```bash
npm run lint
git add src/features/workflowEditor/ src/features/shared/styledComponents/
git commit -m "feat: restyle workflow editor with neumorphic cards"
```

---

### Task 13: Minimalist mode + contact page

**Files:**
- Modify: `src/features/shared/MinimalistLayout.jsx`
- Modify: `src/features/contactMe/ContactMe.jsx` (+ `Contact.jsx` if it holds the markup)

**Interfaces:**
- Consumes: `TemperatureDial` with `compact` prop (Task 8), `NeuCard`, `NeuIconButton`.
- Produces: no API changes.

- [ ] **Step 1: Minimalist layout**

Read `MinimalistLayout.jsx`. Keep ALL of its BLE/Redux logic and its exit-minimalist-mode control. Replace the temperature display markup with `<TemperatureDial compact ...
/>` fed from the same Redux selectors it already reads (`currentTemperature`, `targetTemperature`, `isF`, `isHeatOn`), with `onTargetCommit` wired the same way as `TemperatureDialContainer` (import and reuse `TemperatureDialContainer`? No — MinimalistLayout must not double-subscribe BLE notifications if it already has its own; if MinimalistLayout has NO current-temp subscription of its own, simply render `<TemperatureDialContainer />` — read the file and choose: reuse the container when it doesn't create duplicate subscriptions, otherwise use the presentational dial with the layout's existing data). Remove any `font-family: "digital-mono"` usage in this file. Heat/Fan toggles stay (they're the restyled ToggleSwitch already).

- [ ] **Step 2: Contact page**

Wrap the contact content in `NeuCard` (max-width 30rem, centered, `margin: 2rem auto`); social icon links become `NeuIconButton as="a" href=... target="_blank"` keeping the existing URLs from `src/constants/constants.js`.

- [ ] **Step 3: Verify in browser**

Enable Mini-Modus from Settings: compact dial + heat/fan render, exit control works. `/Volcano/ContactMe`: card centered, icons round. Both modes.

- [ ] **Step 4: Lint and commit**

```bash
npm run lint
git add src/features/shared/MinimalistLayout.jsx src/features/contactMe/
git commit -m "feat: restyle minimalist mode and contact page"
```

---

### Task 14: Cleanup — delete legacy theming, fonts, snowfall; final verification

**Files:**
- Delete: `src/themes/dark.js`, `light.js`, `flamingo.js`, `fun.js`, `volcanicAsh.js`, `grayScale.js`, `greenScale.js`, `redScale.js`, `purpleScale.js`, `prideClassic.js`, `prideVibrant.js`, `festivities/` (whole dir), `generators/`, `ThemeProvider.js`, `base.js`, `registry.js`, `validation.js`, `hooks/useThemedProps.js`, `README.md`
- Delete: `src/constants/themeDates.js`, `src/constants/themeIds.js`
- Delete: `src/features/shared/Snowfall.jsx`, `src/features/settings/Theming/`
- Delete: `src/fonts/digital-7.mono.ttf`
- Modify: `src/index.css`, `package.json` (remove `react-snowfall`)

**Interfaces:** none — pure removal. PrideText.jsx STAYS (neutralized pass-through, still imported by ~100 call sites).

- [ ] **Step 1: Find remaining consumers BEFORE deleting**

Run (Git Bash):

```bash
grep -rn --include='*.js*' -e 'themes/ThemeProvider' -e 'themeIds' -e 'themeDates' -e 'Snowfall' -e 'digital-mono' -e 'digital-7' -e 'react-snowfall' -e 'themes/base' -e 'useThemedProps' src/
```

Every hit outside the files being deleted must be fixed first (remove import + usage; components should read `useTheme()`/`props.theme` instead of `GetTheme`). Typical stragglers: `MinimalistLayout.jsx`, `CurrentTemperature.jsx`, `CurrentWorkflowExecutionDisplay.jsx` (digital-mono font-family), any component still importing `GetTheme`.

- [ ] **Step 2: Delete the files**

```bash
git rm -r src/themes/festivities src/themes/generators src/themes/hooks
git rm src/themes/dark.js src/themes/light.js src/themes/flamingo.js src/themes/fun.js src/themes/volcanicAsh.js src/themes/grayScale.js src/themes/greenScale.js src/themes/redScale.js src/themes/purpleScale.js src/themes/prideClassic.js src/themes/prideVibrant.js src/themes/ThemeProvider.js src/themes/base.js src/themes/registry.js src/themes/validation.js src/themes/README.md
git rm src/constants/themeDates.js src/constants/themeIds.js
git rm src/features/shared/Snowfall.jsx
git rm -r src/features/settings/Theming
git rm src/fonts/digital-7.mono.ttf
npm uninstall react-snowfall
```

Also remove the `react-snowfall` override block from `package.json` `overrides`.

- [ ] **Step 3: Clean `src/index.css`**

Remove the `@font-face` block for `digital-mono`. Set the body font stack to a modern sans (keep existing stack if already system-sans):

```css
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
```

- [ ] **Step 4: Full verification**

```bash
npx vitest run     # all tests pass
npm run lint       # clean
npm run build      # builds without errors; PWA assets generated (check dist/ for sw.js + manifest link)
npm run preview    # open the built app
```

Manual checklist (browser, mobile viewport too):
1. `/` connect screen renders; app installable (Chrome: install icon appears / `beforeinstallprompt` fires — check `window.deferredPrompt` in console).
2. Mode Hell/Dunkel/Auto switches live incl. OS toggle in Auto; meta theme-color follows (inspect `<head>`).
3. Accent editor + presets update dial, buttons, toggles, sliders app-wide; persists across reload.
4. Legacy-config migration: in devtools run `localStorage.setItem("projectOnyxVapeApp", JSON.stringify({currentTheme: "Dark", workflows: {items: []}}))`, reload → app in dark mode, config has `appearanceMode: "dark"`, no `currentTheme`.
5. Dial drag (touch emulation), +/−, presets, heat/fan toggles, workflow editor DnD, settings toggles, minimalist mode, contact page — all functional in both modes.
6. No horizontal scroll on any screen at 375×667.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove legacy theme system, digital-7 font, and snowfall"
```

---

## Plan Self-Review Notes

- **Spec coverage:** theme factory + tokens (T2), light/dark/auto + matchMedia + meta theme-color (T4), migration (T3), color editor + presets + contrast guard (T2/T9), dial with drag + commit-on-release + pulse (T8), bottom nav (T7), settings restyle (T9/T10), connect screen (T11), workflow editor (T12), minimalist + contact (T13), removals + digital-7 + verification gates (T14). PWA untouched throughout; install button restyled in T10.
- **Type consistency:** `theme.neumorphic.{surface,text,textSecondary,shadowDark,shadowLight,raised,raisedSmall,pressed,flat,radiusCard,radiusPill,danger,onDanger,accent:{start,end,gradient,gradientVertical,tint,onAccent}}` is the single token vocabulary used in Tasks 5–13 and matches the factory in Task 2. Config fields `appearanceMode`/`accentColors` match between Tasks 3, 4, 9. Dial props match between Tasks 8 and 13.
- **Placeholder scan:** no TBD/TODO; the two code errata found on review (double mix line, empty keyframes artifact) were fixed inline.
