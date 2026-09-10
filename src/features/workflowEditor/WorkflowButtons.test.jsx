import { beforeEach, afterEach, expect, it, vi } from "vitest";
vi.hoisted(() => {
  const data = new Map();
  globalThis.window = { localStorage: { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) } };
  globalThis.alert = vi.fn();
});
const device = vi.hoisted(() => ({ writes: [], temp: 200, target: 180, heat: false, failTarget: false, pendingFan: null }));
vi.mock("react-redux", async () => {
  const { default: store } = await import("../../store");
  return { useDispatch: () => store.dispatch, useSelector: (selector) => selector(store.getState()) };
});
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
vi.mock("../../services/BleCharacteristicCache", () => ({
  isDeviceConnected: () => true,
  getCharacteristic: (uuid) => ({
    writeValue: async (buffer) => {
      device.writes.push(uuid);
      if (uuid.includes("10110003")) {
        if (device.failTarget) throw new Error("target failed");
        device.target = new DataView(buffer).getUint32(0, true) / 10;
      }
      if (uuid.includes("1011000f")) device.heat = true;
      if (uuid.includes("10110010")) device.heat = false;
      if (uuid.includes("10110013") && device.pendingFan) await device.pendingFan;
    },
    readValue: async () => {
      const value = new DataView(new ArrayBuffer(2));
      value.setUint16(0, uuid.includes("1010000c") ? (device.heat ? 32 : 0) :
        uuid.includes("10110003") ? device.target * 10 : device.temp * 10, true);
      return value;
    },
  }),
}));
import WorkflowButtons from "./WorkflowButtons";
import store from "../../store";
import { setCurrentWorkflows } from "../settings/settingsSlice";
import { setCurrentTemperature, setTargetTemperature, setIsHeatOn, setControlError } from "../deviceInteraction/deviceInteractionSlice";
import { cancelCurrentWorkflow, clearQueuesAndTimers, resumeWorkflow } from "../../services/bleQueueing";
import { heatOnUuid, heatOffUuid, fanOffUuid, writeTemperatureUuid } from "../../constants/uuids";

function start(payload) {
  store.dispatch(setCurrentWorkflows([{ id: 99, name: "test", payload }]));
  WorkflowButtons().props.children[0].props.onClick();
}
beforeEach(() => {
  vi.useFakeTimers();
  store.dispatch(setControlError(null));
  vi.spyOn(console, "warn").mockImplementation(() => {});
  Object.assign(device, { writes: [], temp: 20, target: 180, heat: false, failTarget: false, pendingFan: null });
  store.dispatch(setCurrentTemperature(20));
  store.dispatch(setTargetTemperature(180));
  store.dispatch(setIsHeatOn(false));
});
afterEach(async () => { clearQueuesAndTimers(); await vi.runAllTimersAsync(); vi.useRealTimers(); vi.restoreAllMocks(); });

it("never sends heat ON if setting the target fails", async () => {
  device.failTarget = true;
  start([{ type: "heatOn", payload: 190 }]);
  await vi.advanceTimersByTimeAsync(2000);
  expect(device.writes).not.toContain(heatOnUuid);
  expect(store.getState().workflow.currentWorkflow).toBeUndefined();
});

it("does not retry ON when the device switches heat off during startup", async () => {
  start([{ type: "heatOn", payload: 190 }]);
  await vi.advanceTimersByTimeAsync(200);
  device.heat = false;
  store.dispatch(setIsHeatOn(false));
  await vi.advanceTimersByTimeAsync(6000);
  expect(device.writes.filter((id) => id === heatOnUuid)).toHaveLength(1);
  expect(store.getState().workflow.currentWorkflow).toBeUndefined();
});

it("does not overwrite a target lowered on the device", async () => {
  start([{ type: "heatOn", payload: 190 }]);
  await vi.advanceTimersByTimeAsync(200);
  device.target = 150;
  store.dispatch(setTargetTemperature(150));
  store.dispatch(setIsHeatOn(true));
  await vi.advanceTimersByTimeAsync(2000);
  expect(device.writes.filter((id) => id === writeTemperatureUuid)).toHaveLength(1);
  expect(store.getState().workflow.currentWorkflow).toBeUndefined();
});

it("aborts on an invalid fresh sensor reading instead of trusting old Redux data", async () => {
  device.temp = 6553.5;
  start([{ type: "heatOn", payload: 190 }]);
  await vi.advanceTimersByTimeAsync(2000);
  expect(store.getState().workflow.currentWorkflow).toBeUndefined();
  expect(device.writes).toContain(heatOffUuid);
});

it("rejects a malformed saved workflow before it can turn on heat", async () => {
  start([{ type: "heatOn", payload: 999 }]);
  await vi.advanceTimersByTimeAsync(2000);
  expect(device.writes).not.toContain(heatOnUuid);
});

it("does not let an old fan completion advance a replacement workflow", async () => {
  let release;
  device.pendingFan = new Promise((resolve) => { release = resolve; });
  start([{ type: "fanOn", payload: 0.2 }, { type: "heatOn", payload: 190 }]);
  await vi.advanceTimersByTimeAsync(10);
  cancelCurrentWorkflow();
  release();
  await vi.advanceTimersByTimeAsync(2000);
  expect(device.writes).not.toContain(heatOnUuid);
  expect(device.writes).toContain(fanOffUuid);
});

it("keeps manual pauses nonblocking and discards resume after cancellation", async () => {
  start([{ type: "wait", payload: 0 }, { type: "heatOn", payload: 190 }]);
  await vi.advanceTimersByTimeAsync(1000);
  expect(store.getState().workflow.isPaused).toBe(true);
  expect(device.writes).not.toContain(heatOnUuid);
  cancelCurrentWorkflow();
  resumeWorkflow();
  await vi.advanceTimersByTimeAsync(2000);
  expect(device.writes).not.toContain(heatOnUuid);
});

it("completes a valid heat, timed pump, and heat-off sequence", async () => {
  start([{ type: "heatOn", payload: 190 }, { type: "fanOn", payload: 0.5 }, { type: "heatOff" }]);
  await vi.advanceTimersByTimeAsync(200);
  device.temp = 190;
  await vi.advanceTimersByTimeAsync(2500);
  expect(store.getState().workflow.currentWorkflow).toBeUndefined();
  expect(device.heat).toBe(false);
  expect(device.writes.filter((id) => id === heatOnUuid)).toHaveLength(1);
  expect(device.writes.slice(-2)).toEqual([fanOffUuid, heatOffUuid]);
});
