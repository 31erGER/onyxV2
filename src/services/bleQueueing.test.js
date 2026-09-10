import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  const data = new Map();
  globalThis.window = { localStorage: { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) } };
});
const ble = vi.hoisted(() => ({ writes: [], failHeatOff: false }));
vi.mock("./BleCharacteristicCache", () => ({
  isDeviceConnected: () => true,
  getCharacteristic: (id) => ({ writeValue: async () => {
    ble.writes.push(id);
    if (ble.failHeatOff && id.includes("10110010")) throw new Error("offline");
  } }),
}));
import { AddToQueue, AddToWorkflowQueue, cancelCurrentWorkflow, clearQueuesAndTimers } from "./bleQueueing";
import { heatOffUuid, fanOffUuid } from "../constants/uuids";
import store from "../store";
import { setCurrentWorkflow } from "../features/workflowEditor/workflowSlice";
import { setControlError } from "../features/deviceInteraction/deviceInteractionSlice";

beforeEach(() => { vi.useFakeTimers(); store.dispatch(setControlError(null)); ble.writes.length = 0; ble.failHeatOff = false; });
afterEach(async () => { clearQueuesAndTimers(); await vi.runAllTimersAsync(); vi.useRealTimers(); });

describe("device command cancellation", () => {
  it("stops both heater and pump when a workflow is cancelled", async () => {
    cancelCurrentWorkflow();
    await vi.runAllTimersAsync();
    expect(ble.writes).toEqual([heatOffUuid, fanOffUuid]);
  });

  it("still attempts pump off if heater off fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    ble.failHeatOff = true;
    cancelCurrentWorkflow();
    await vi.runAllTimersAsync();
    expect(ble.writes).toContain(fanOffUuid);
    vi.restoreAllMocks();
  });

  it("does not run a second queue worker while a cleared operation is in flight", async () => {
    let release;
    const pending = new Promise((resolve) => { release = resolve; });
    const events = [];
    AddToQueue(async () => { events.push("old-start"); await pending; events.push("old-end"); });
    clearQueuesAndTimers();
    AddToQueue(async () => { events.push("new"); });
    expect(events).toEqual(["old-start"]);
    release();
    await vi.runAllTimersAsync();
    expect(events).toEqual(["old-start", "old-end", "new"]);
  });

  it("aborts and drops later workflow steps after a BLE failure", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    store.dispatch(setCurrentWorkflow({ id: 1, payload: [] }));
    const heatAgain = vi.fn();
    AddToWorkflowQueue([async () => { throw new Error("write failed"); }, heatAgain]);
    await vi.runAllTimersAsync();
    expect(store.getState().workflow.currentWorkflow).toBeUndefined();
    expect(heatAgain).not.toHaveBeenCalled();
    expect(ble.writes).toEqual([heatOffUuid, fanOffUuid]);
    vi.restoreAllMocks();
  });

  it("reports a stuck BLE operation without starting a concurrent GATT worker", async () => {
    let release;
    AddToQueue(() => new Promise((resolve) => { release = resolve; }));
    const later = vi.fn();
    AddToQueue(later);
    await vi.advanceTimersByTimeAsync(16000);
    expect(store.getState().deviceInteraction.controlError).toBe("communication");
    expect(later).not.toHaveBeenCalled();
    expect(ble.writes).toEqual([]);
    release();
    await vi.runAllTimersAsync();
    expect(ble.writes).toEqual([heatOffUuid, fanOffUuid]);
  });
});
