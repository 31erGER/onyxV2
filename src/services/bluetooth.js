import { setControlError } from "../features/deviceInteraction/deviceInteractionSlice";
import {
  primaryServiceUuidVolcano1,
  primaryServiceUuidVolcano2,
  primaryServiceUuidVolcano3,
  primaryServiceUuidVolcano4,
  primaryServiceUuidVolcano5,
} from "../constants/uuids";
import { clearCache, buildCacheFromBleDevice } from "../services/BleCharacteristicCache";

import store from "../store";
import { RE_INITIALIZE_STORE } from "../constants/actions";
import { AddToPriorityQueue, clearQueuesAndTimers } from "./bleQueueing";
import { startDeviceTelemetry, stopDeviceTelemetry } from "./deviceTelemetry";

const bluetoothConnectFunction = async (onConnected, onDisconnected) => {
  const iSiOSdevice =
    window.navigator.userAgent.includes("iPhone") ||
    window.navigator.userAgent.includes("WebBLE") ||
    window.navigator.userAgent.includes("iPad");

  if (!navigator.bluetooth) {
    const bleNotSupported = `WEB BLE not supported. ${
      iSiOSdevice
        ? 'Download "WebBLE" or "Bluefy" from the app store to use Project Onyx on this device.'
        : ""
    }`;
    alert(bleNotSupported);
    throw new Error(bleNotSupported);
  }

  const options = {
    filters: [{ namePrefix: "S&B VOLCANO" }],
    optionalServices: [primaryServiceUuidVolcano1, primaryServiceUuidVolcano2,
      primaryServiceUuidVolcano3, primaryServiceUuidVolcano4, primaryServiceUuidVolcano5],
  };
  let device;
  let disconnectHandler;
  try {
    device = await navigator.bluetooth.requestDevice(options);
    if (!device.name?.includes("S&B VOLCANO")) return false;
    stopDeviceTelemetry();
    clearQueuesAndTimers();
    store.dispatch(RE_INITIALIZE_STORE());
    await new Promise((resolve, reject) => {
      AddToPriorityQueue(async () => {
        try {
          await buildCacheFromBleDevice(device);
          disconnectHandler = () => {
            device.removeEventListener("gattserverdisconnected", disconnectHandler);
            stopDeviceTelemetry();
            clearQueuesAndTimers();
            clearCache();
            store.dispatch(RE_INITIALIZE_STORE());
            store.dispatch(setControlError("disconnected"));
            onDisconnected();
          };
          device.addEventListener("gattserverdisconnected", disconnectHandler);
          await startDeviceTelemetry();
          if (!device.gatt.connected) throw new Error("Disconnected during initialization");
          resolve();
        } catch (error) { reject(error); }
      }, reject);
    });
    onConnected();
    return true;
  } catch (error) {
    if (disconnectHandler) device.removeEventListener("gattserverdisconnected", disconnectHandler);
    stopDeviceTelemetry();
    clearQueuesAndTimers();
    clearCache();
    device?.gatt?.disconnect();
    const errorMessage = error.toString();
    if (
      errorMessage.includes("User cancelled") ||
      errorMessage.includes("a user gesture") ||
      errorMessage === "2" //The things you do for 3rd party support
    ) {
      return false;
    }
    const alertMessage =
      "Bluetooth connection error.  Please refresh the page and try again.\n" +
      errorMessage +
      "\n" +
      error.stack;
    alert(alertMessage);
    throw new Error(alertMessage);
  }
};

export default bluetoothConnectFunction;
