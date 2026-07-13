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
