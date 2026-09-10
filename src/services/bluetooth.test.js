import { beforeEach, afterEach, expect, it, vi } from "vitest";
vi.hoisted(() => {
  const data = new Map();
  globalThis.window = { localStorage: { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) } };
});
import connect from "./bluetooth";
import { getCharacteristic, isDeviceConnected, clearCache } from "./BleCharacteristicCache";
import { stopDeviceTelemetry } from "./deviceTelemetry";
import { AddToQueue, clearQueuesAndTimers } from "./bleQueueing";
import { register1Uuid, currentTemperatureUuid, writeTemperatureUuid, heatOnUuid, fanOnUuid, autoShutoffSettingUuid } from "../constants/uuids";
import store from "../store";

let device, maximum, inFlight, writes, unsub;
beforeEach(() => {
  vi.useFakeTimers();
  maximum = 0; inFlight = 0; writes = [];
  const chars = new Map();
  device = new EventTarget();
  device.name = "S&B VOLCANO H";
  device.gatt = {
    connected: false,
    connect: async () => {
      device.gatt.connected = true;
      return { getPrimaryService: async () => ({ getCharacteristic: async (id) => {
        if (!chars.has(id)) {
          const char = new EventTarget();
          const operation = async (result) => {
            maximum = Math.max(maximum, ++inFlight);
            await Promise.resolve();
            --inFlight;
            return result;
          };
          char.startNotifications = () => operation();
          char.readValue = () => {
            const value = new DataView(new ArrayBuffer(2));
            value.setUint16(0, id === register1Uuid ? 32 : id === currentTemperatureUuid ? 1800 : id === writeTemperatureUuid ? 1900 : 0, true);
            return operation(value);
          };
          char.writeValue = async () => { writes.push(id); await operation(); };
          chars.set(id, char);
        }
        return chars.get(id);
      } }) };
    },
    disconnect: () => {
      if (!device.gatt.connected) return;
      device.gatt.connected = false;
      device.dispatchEvent(new Event("gattserverdisconnected"));
    },
  };
  vi.stubGlobal("navigator", { userAgent: "Android", bluetooth: { requestDevice: vi.fn(async () => device) } });
  window.navigator = navigator;
  vi.stubGlobal("document", new EventTarget());
  vi.stubGlobal("alert", vi.fn());
});
afterEach(async () => {
  unsub?.(); unsub = null;
  stopDeviceTelemetry(); clearQueuesAndTimers(); clearCache();
  await vi.runAllTimersAsync(); vi.useRealTimers(); vi.unstubAllGlobals();
});

it("serializes initialization with reads scheduled by a newly rendered settings screen", async () => {
  let queued = false;
  unsub = store.subscribe(() => {
    if (!queued && store.getState().deviceInteraction.isHeatOn === true) {
      queued = true;
      AddToQueue(() => getCharacteristic(autoShutoffSettingUuid).readValue());
    }
  });
  expect(await connect(() => {}, () => {})).toBe(true);
  await vi.advanceTimersByTimeAsync(100);
  expect(maximum).toBe(1);
  expect(isDeviceConnected()).toBe(true);
  expect(store.getState().deviceInteraction.isHeatOn).toBe(true);
  expect(writes).not.toContain(heatOnUuid);
  expect(writes).not.toContain(fanOnUuid);
  const options = navigator.bluetooth.requestDevice.mock.calls[0][0];
  expect(options.optionalServices).toHaveLength(5);
});

it("returns false for cancelled selection and does not claim a connection", async () => {
  navigator.bluetooth.requestDevice.mockRejectedValue(new Error("User cancelled"));
  const connected = vi.fn();
  expect(await connect(connected, () => {})).toBe(false);
  expect(connected).not.toHaveBeenCalled();
  expect(isDeviceConnected()).toBe(false);
});

it("clears control state and subscriptions on an unexpected disconnect", async () => {
  const disconnected = vi.fn();
  await connect(() => {}, disconnected);
  device.gatt.disconnect();
  expect(disconnected).toHaveBeenCalledOnce();
  expect(isDeviceConnected()).toBe(false);
  expect(store.getState().deviceInteraction.isHeatOn).toBeUndefined();
  expect(store.getState().deviceInteraction.controlError).toBe("disconnected");
});

it("settles a reconnect whose queued initialization is cancelled by an old BLE failure", async () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  let fail;
  AddToQueue(() => new Promise((_, reject) => { fail = reject; }));
  const connection = connect(() => {}, () => {});
  const outcome = connection.then(() => "connected", () => "rejected");
  await Promise.resolve();
  await Promise.resolve();
  fail(new Error("old connection lost"));
  await vi.advanceTimersByTimeAsync(10);
  expect(await Promise.race([outcome, Promise.resolve("pending")])).toBe("rejected");
  warn.mockRestore();
});
