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
