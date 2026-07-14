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
