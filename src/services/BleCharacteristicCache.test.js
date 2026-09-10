import { beforeEach, expect, it, vi } from "vitest";
import { buildCacheFromBleDevice, clearCache, getCharacteristic, isDeviceConnected } from "./BleCharacteristicCache";
import { autoShutoffSettingUuid, heatOnUuid } from "../constants/uuids";

function fakeDevice(getCharacteristic) {
  const device = { gatt: { connected: false, connect: async () => {
    device.gatt.connected = true;
    return { getPrimaryService: async () => ({ getCharacteristic }) };
  }, disconnect: () => { device.gatt.connected = false; } } };
  return device;
}
beforeEach(() => clearCache());
it("never exposes a partial connection after initialization fails", async () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const device = fakeDevice(async (uuid) => {
    if (uuid === autoShutoffSettingUuid) throw new Error("unavailable");
    return { uuid };
  });
  await expect(buildCacheFromBleDevice(device)).rejects.toThrow();
  expect(isDeviceConnected()).toBe(false);
  expect(device.gatt.connected).toBe(false);
  expect(() => getCharacteristic(heatOnUuid)).toThrow();
  warn.mockRestore();
});
it("does not consider a stale cache a connected device", async () => {
  const device = fakeDevice(async (uuid) => ({ uuid }));
  await buildCacheFromBleDevice(device);
  expect(isDeviceConnected()).toBe(true);
  device.gatt.disconnect();
  expect(isDeviceConnected()).toBe(false);
});
it("publishes the cache only after all characteristics are available", async () => {
  let release;
  const wait = new Promise((resolve) => { release = resolve; });
  const device = fakeDevice(async (uuid) => {
    if (uuid === autoShutoffSettingUuid) await wait;
    return { uuid };
  });
  const connection = buildCacheFromBleDevice(device);
  await new Promise((resolve) => setTimeout(resolve, 0));
  const wasConnected = isDeviceConnected();
  release();
  await connection;
  expect(wasConnected).toBe(false);
  expect(isDeviceConnected()).toBe(true);
});
