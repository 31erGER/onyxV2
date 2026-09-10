import store from "../store";
import { getCharacteristic } from "./BleCharacteristicCache";
import { AddToQueue, cancelCurrentWorkflow } from "./bleQueueing";
import { register1Uuid, register2Uuid, currentTemperatureUuid, writeTemperatureUuid } from "../constants/uuids";
import { heatingMask, fanMask, celciusMask } from "../constants/masks";
import { convertBLEtoUint16, convertCurrentTemperatureCharacteristicToCelcius } from "./utils";
import { setCurrentTemperature, setTargetTemperature, setIsHeatOn, setIsFanOn, setControlError } from "../features/deviceInteraction/deviceInteractionSlice";
import { setIsF } from "../features/settings/settingsSlice";

let session = 0;
let cleanup = [];
export function stopDeviceTelemetry() {
  session++;
  cleanup.splice(0).forEach((remove) => remove());
}

// Connection-owned observations continue across routes and both UI layouts.
export async function startDeviceTelemetry() {
  stopDeviceTelemetry();
  const generation = session;
  let observedHeat = false;
  let pending = false;
  const active = () => session === generation;
  const handlers = [
    [register1Uuid, (value) => {
      const status = convertBLEtoUint16(value);
      const heat = (status & heatingMask) !== 0;
      const workflow = store.getState().workflow;
      const step = workflow.currentWorkflow?.payload?.[workflow.currentWorkflowStepId - 1];
      // A planned HEAT_OFF step is allowed; all other physical OFF transitions win.
      if (observedHeat && !heat && workflow.currentWorkflow && step?.type !== "heatOff") {
        cancelCurrentWorkflow();
      }
      observedHeat = heat;
      store.dispatch(setIsHeatOn(heat));
      store.dispatch(setIsFanOn((status & fanMask) !== 0));
    }],
    [register2Uuid, (value) => store.dispatch(setIsF((convertBLEtoUint16(value) & celciusMask) !== 0))],
    [currentTemperatureUuid, (value) => {
      const temperature = convertCurrentTemperatureCharacteristicToCelcius(value);
      if (temperature === null) {
        store.dispatch(setControlError("sensor"));
        cancelCurrentWorkflow();
      }
      store.dispatch(setCurrentTemperature(temperature));
    }],
    [writeTemperatureUuid, (value) => store.dispatch(setTargetTemperature(convertCurrentTemperatureCharacteristicToCelcius(value)))],
  ];
  try {
    for (const [id, handle] of handlers) {
      if (!active()) throw new Error("Connection initialization cancelled");
      const characteristic = getCharacteristic(id);
      const listener = (event) => {
        if (!active()) return;
        try { handle(event.target.value); }
        catch (error) {
          console.warn("Invalid device notification", error);
          store.dispatch(setControlError("sensor"));
          cancelCurrentWorkflow();
        }
      };
      characteristic.addEventListener("characteristicvaluechanged", listener);
      cleanup.push(() => characteristic.removeEventListener("characteristicvaluechanged", listener));
      await characteristic.startNotifications();
      if (!active()) throw new Error("Connection initialization cancelled");
      const value = await characteristic.readValue();
      if (!active()) throw new Error("Connection initialization cancelled");
      handle(value);
    }
    // Poll during WAIT/FAN steps too, so missed notifications cannot let a later
    // loop restart a heater that firmware or the user switched off.
    const interval = setInterval(() => {
      if (!active() || pending || !store.getState().workflow.currentWorkflow) return;
      pending = true;
      AddToQueue(async () => {
        try {
          for (const [id, handle] of [handlers[0], handlers[2]]) {
            if (!active() || !store.getState().workflow.currentWorkflow) return;
            const value = await getCharacteristic(id).readValue();
            if (!active()) return;
            handle(value);
          }
        } finally { pending = false; }
      });
    }, 2000);
    cleanup.push(() => clearInterval(interval));
  } catch (error) {
    if (active()) stopDeviceTelemetry();
    throw error;
  }
}
