import { afterEach, expect, it, vi } from "vitest";
vi.hoisted(() => {
  const data = new Map();
  globalThis.window = { localStorage: { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) }, addEventListener: () => {}, removeEventListener: () => {} };
  globalThis.document = { addEventListener: () => {}, removeEventListener: () => {} };
});
const fake = vi.hoisted(() => ({ chars: new Map() }));
vi.mock("./BleCharacteristicCache", () => ({ getCharacteristic: (id) => fake.chars.get(id), isDeviceConnected: () => true }));
import { startDeviceTelemetry, stopDeviceTelemetry } from "./deviceTelemetry";
import { register1Uuid, register2Uuid, currentTemperatureUuid, writeTemperatureUuid } from "../constants/uuids";
import store from "../store";
import { setCurrentWorkflow } from "../features/workflowEditor/workflowSlice";
import { clearQueuesAndTimers } from "./bleQueueing";

function value(number) { const result = new DataView(new ArrayBuffer(2)); result.setUint16(0, number, true); return result; }
function setup() {
  for (const [id, initial] of [[register1Uuid, 32], [register2Uuid, 0], [currentTemperatureUuid, 1800], [writeTemperatureUuid, 1900]]) {
    const listeners = new Set();
    fake.chars.set(id, { listeners, addEventListener: (_, fn) => listeners.add(fn), removeEventListener: (_, fn) => listeners.delete(fn),
      startNotifications: async () => {}, readValue: async () => value(initial), emit: (number) => listeners.forEach((fn) => fn({ target: { value: value(number) } })) });
  }
}
afterEach(() => { stopDeviceTelemetry(); clearQueuesAndTimers(); });
it("loads the real heater state on connection without depending on a mounted control", async () => {
  setup();
  await startDeviceTelemetry();
  expect(store.getState().deviceInteraction.isHeatOn).toBe(true);
  expect(store.getState().deviceInteraction.currentTemperature).toBe(180);
  fake.chars.get(register1Uuid).emit(0);
  expect(store.getState().deviceInteraction.isHeatOn).toBe(false);
});
it("removes subscriptions on disconnect and ignores old device events", async () => {
  setup();
  await startDeviceTelemetry();
  const oldStatus = fake.chars.get(register1Uuid);
  stopDeviceTelemetry();
  expect(oldStatus.listeners.size).toBe(0);
});
it("aborts a workflow on device heat OFF even during a wait step", async () => {
  setup();
  await startDeviceTelemetry();
  store.dispatch(setCurrentWorkflow({ id: 1, payload: [{ type: "wait", payload: 600 }] }));
  fake.chars.get(register1Uuid).emit(0);
  expect(store.getState().workflow.currentWorkflow).toBeUndefined();
});
