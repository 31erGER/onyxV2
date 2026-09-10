import { beforeEach, afterEach, expect, it, vi } from "vitest";
vi.hoisted(() => {
  const data = new Map();
  globalThis.window = { localStorage: { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) } };
});
const device = vi.hoisted(() => ({ writes: [], failTarget: false, pending: null }));
vi.mock("./BleCharacteristicCache", () => ({
  isDeviceConnected: () => true,
  getCharacteristic: (uuid) => ({ writeValue: async (buffer) => {
    device.writes.push([uuid, [...new Uint8Array(buffer)]]);
    if (uuid.includes("10110003")) {
      if (device.failTarget) throw new Error("failed");
      if (device.pending) await device.pending;
    }
  } }),
}));
import { queueTemperature, queueHeat, queueFan, queueAutoShutoff, beginTemperatureIntent } from "./deviceCommands";
import { AddToQueue, clearQueuesAndTimers } from "./bleQueueing";
import { heatOnUuid, heatOffUuid, fanOnUuid, fanOffUuid, writeTemperatureUuid, autoShutoffSettingUuid } from "../constants/uuids";
import { setCurrentWorkflow } from "../features/workflowEditor/workflowSlice";
import store from "../store";
import { setIsHeatOn, setControlError } from "../features/deviceInteraction/deviceInteractionSlice";
beforeEach(() => {
  vi.useFakeTimers();
  store.dispatch(setControlError(null));
  vi.spyOn(console, "warn").mockImplementation(() => {});
  Object.assign(device, { writes: [], failTarget: false, pending: null });
  store.dispatch(setIsHeatOn(false));
});
afterEach(async () => { clearQueuesAndTimers(); await vi.runAllTimersAsync(); vi.useRealTimers(); vi.restoreAllMocks(); });
it("writes the new Celsius target before enabling heat behind pending BLE work", async () => {
  let release;
  AddToQueue(() => new Promise((resolve) => { release = resolve; }));
  queueTemperature(180);
  release();
  await vi.runAllTimersAsync();
  expect(device.writes).toEqual([[writeTemperatureUuid, [8, 7, 0, 0]], [heatOnUuid, [0]]]);
});
it("never enables heat after a failed target write", async () => {
  device.failTarget = true;
  queueTemperature(180);
  await vi.runAllTimersAsync();
  expect(device.writes.map(([id]) => id)).not.toContain(heatOnUuid);
});
it("a manual OFF during a target write prevents its pending ON", async () => {
  let release;
  device.pending = new Promise((resolve) => { release = resolve; });
  queueTemperature(180);
  queueHeat(false);
  release();
  await vi.runAllTimersAsync();
  expect(device.writes.map(([id]) => id)).not.toContain(heatOnUuid);
  expect(device.writes.map(([id]) => id)).toContain(heatOffUuid);
});
it("rejects invalid targets without any device writes", async () => {
  queueTemperature(NaN);
  queueTemperature(231);
  await vi.runAllTimersAsync();
  expect(device.writes).toEqual([]);
});

it("stops a running workflow pump before a manual temperature takes over", async () => {
  store.dispatch(setCurrentWorkflow({ id: 1, payload: [{ type: "fanOn", payload: 60 }] }));
  queueTemperature(180);
  await vi.runAllTimersAsync();
  expect(device.writes.map(([id]) => id)).toEqual([heatOffUuid, fanOffUuid, writeTemperatureUuid, heatOnUuid]);
});
it("drops a queued fan ON when a shutdown fault appears before execution", async () => {
  let release;
  AddToQueue(() => new Promise((resolve) => { release = resolve; }));
  queueFan(true);
  store.dispatch(setControlError("shutdown"));
  release();
  await vi.runAllTimersAsync();
  expect(device.writes.map(([id]) => id)).not.toContain(fanOnUuid);
});
it("does not let a delayed increment overwrite a newer dial selection", async () => {
  const intent = beginTemperatureIntent();
  queueTemperature(200);
  queueTemperature(181, undefined, intent);
  await vi.runAllTimersAsync();
  expect(device.writes.filter(([id]) => id === writeTemperatureUuid)).toEqual([[writeTemperatureUuid, [208, 7, 0, 0]]]);
});
it("rejects zero, nonfinite, and out-of-range automatic shutoff settings", async () => {
  for (const value of [0, NaN, Infinity, -1, 361]) queueAutoShutoff(value);
  await vi.runAllTimersAsync();
  expect(device.writes).toEqual([]);
  queueAutoShutoff(30);
  await vi.runAllTimersAsync();
  expect(device.writes).toContainEqual([autoShutoffSettingUuid, [8, 7]]);
});
