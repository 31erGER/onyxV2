import store from "../store";
import { getCharacteristic, isDeviceConnected } from "./BleCharacteristicCache";
import { AddToPriorityQueue, cancelCurrentWorkflow, getWorkflowGeneration } from "./bleQueueing";
import { convertToUInt8BLE, convertToUInt16BLE, convertToUInt32BLE, isValueInValidVolcanoCelciusRange } from "./utils";
import { heatOnUuid, fanOnUuid, fanOffUuid, writeTemperatureUuid, autoShutoffSettingUuid } from "../constants/uuids";
import { setAutoShutoffTime } from "../features/settings/settingsSlice";
import { setIsHeatOn, setIsFanOn, setTargetTemperature } from "../features/deviceInteraction/deviceInteractionSlice";

let temperatureIntent = 0;
export function beginTemperatureIntent() { return ++temperatureIntent; }
export function getTemperatureIntent() { return temperatureIntent; }

export function queueTemperature(value, generation = getWorkflowGeneration(), intent = beginTemperatureIntent()) {
  if (!isValueInValidVolcanoCelciusRange(value) || !isDeviceConnected() || store.getState().deviceInteraction.controlError) return;
  if (generation !== getWorkflowGeneration() || intent !== temperatureIntent) return;
  if (store.getState().workflow.currentWorkflow) {
    cancelCurrentWorkflow();
    generation = getWorkflowGeneration();
  }
  AddToPriorityQueue(async () => {
    if (generation !== getWorkflowGeneration() || intent !== temperatureIntent || store.getState().deviceInteraction.controlError) return;
    await getCharacteristic(writeTemperatureUuid).writeValue(convertToUInt32BLE(value * 10));
    if (generation !== getWorkflowGeneration() || intent !== temperatureIntent) return;
    store.dispatch(setTargetTemperature(value));
    if (store.getState().deviceInteraction.isHeatOn !== true) {
      await getCharacteristic(heatOnUuid).writeValue(convertToUInt8BLE(0));
      if (generation === getWorkflowGeneration()) store.dispatch(setIsHeatOn(true));
    }
  });
}

export function queueHeat(nextState) {
  if (!nextState) {
    // Invalidate delayed temperature changes and every pending workflow ON.
    cancelCurrentWorkflow();
    return;
  }
  if (!isDeviceConnected() || store.getState().deviceInteraction.controlError) return;
  const generation = getWorkflowGeneration();
  AddToPriorityQueue(async () => {
    if (generation !== getWorkflowGeneration() || store.getState().deviceInteraction.controlError) return;
    await getCharacteristic(heatOnUuid).writeValue(convertToUInt8BLE(0));
    if (generation === getWorkflowGeneration()) store.dispatch(setIsHeatOn(true));
  });
}

export function queueFan(nextState) {
  if (!isDeviceConnected() || (nextState && store.getState().deviceInteraction.controlError)) return;
  if (store.getState().workflow.currentWorkflow) cancelCurrentWorkflow(false);
  const generation = getWorkflowGeneration();
  AddToPriorityQueue(async () => {
    if (generation !== getWorkflowGeneration() || (nextState && store.getState().deviceInteraction.controlError)) return;
    await getCharacteristic(nextState ? fanOnUuid : fanOffUuid).writeValue(convertToUInt8BLE(0));
    if (generation === getWorkflowGeneration()) store.dispatch(setIsFanOn(nextState));
  });
}

export function queueAutoShutoff(minutes) {
  if (!Number.isFinite(minutes) || minutes < 5 || minutes > 360 || !isDeviceConnected()) return;
  cancelCurrentWorkflow();
  const generation = getWorkflowGeneration();
  AddToPriorityQueue(async () => {
    if (generation !== getWorkflowGeneration() || store.getState().deviceInteraction.controlError) return;
    await getCharacteristic(autoShutoffSettingUuid).writeValue(convertToUInt16BLE(minutes * 60));
    if (generation === getWorkflowGeneration()) store.dispatch(setAutoShutoffTime(minutes));
  });
}
