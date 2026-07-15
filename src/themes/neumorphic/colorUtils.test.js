import { describe, it, expect } from "vitest";
import {
  hexToRgb,
  rgbToHex,
  mix,
  withAlpha,
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
