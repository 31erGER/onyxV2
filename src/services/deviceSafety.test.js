import { describe, expect, it } from "vitest";
import { isValueInValidVolcanoCelciusRange, convertToUInt16BLE, convertToUInt32BLE } from "./utils";
import validateItem from "../features/workflowEditor/shared/WorkflowItemValidator";
import validateConfig from "../features/workflowEditor/WorkflowConfigEditor.jsx/workflowConfigValidator";

describe("reject unsafe command inputs", () => {
  it.each(["180", [180], {}, NaN, Infinity, null, undefined, 39, 231])("rejects a non-numeric or out-of-range target: %j", (value) => {
    expect(isValueInValidVolcanoCelciusRange(value)).toBe(false);
  });
  it.each([NaN, Infinity, -1, 65536, "300"])("rejects invalid uint16 rather than writing a different value: %j", (value) => {
    expect(() => convertToUInt16BLE(value)).toThrow();
  });
  it.each([NaN, Infinity, -1, 4294967296])("rejects invalid uint32: %j", (value) => {
    expect(() => convertToUInt32BLE(value)).toThrow();
  });
  it.each([Infinity, "3seconds", 2147483648, -1])("rejects invalid workflow timer: %j", (payload) => {
    expect(validateItem({ type: "wait", payload }, false)).toBe(false);
  });
  it("rejects an invalid global pump duration in imported JSON", () => {
    expect(validateConfig({ items: [], fanOnGlobal: -1 })).toBe(false);
  });
  it("handles null JSON without throwing", () => {
    expect(validateConfig(null)).toBe(false);
  });
  it("validates stored Celsius independently of the display unit", () => {
    expect(validateConfig({ items: [{ id: 1, name: "cool", payload: [{ type: "heatOn", payload: 40 }] }], fanOnGlobal: 36.5 }, true)).toBe(true);
  });
  it("preserves little endian bytes for valid device values", () => {
    expect([...new Uint8Array(convertToUInt32BLE(2300))]).toEqual([252, 8, 0, 0]);
    expect([...new Uint8Array(convertToUInt16BLE(1800))]).toEqual([8, 7]);
  });
});
