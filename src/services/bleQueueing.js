import {
  setCurrentWorkflow,
  setCurrentWorkflowStepId,
  setCurrentStepEllapsedTimeInSeconds,
  setWorkflowPaused,
} from "../features/workflowEditor/workflowSlice";
import store from "../store";

import { getCharacteristic, isDeviceConnected } from "./BleCharacteristicCache";
import { fanOffUuid, heatOffUuid } from "../constants/uuids";
import { setIsHeatOn, setIsFanOn, setControlError } from "../features/deviceInteraction/deviceInteractionSlice";
import { convertToUInt8BLE } from "./utils";
import { startWorkflowRuntime, stopWorkflowRuntime, isWorkflowRuntimeCurrent } from "./workflowRuntime";

const currentIntervals = [];
const currentSetTimeouts = [];
const queue = [];
const priorityQueue = [];

let isQueueProcessing = false;
let currentWorkflowIndex = 0;
let workflowFunctions;
// Bumped every time a workflow starts or is cancelled. Work that was already queued
// when that happened belongs to an older generation and must not touch the device -
// otherwise a cancelled workflow can still switch the heater back on.
let workflowGeneration = 0;
let resumeCallback;

export { currentIntervals, currentSetTimeouts };

export function getWorkflowGeneration() {
  return workflowGeneration;
}

export function clearIntervals() {
  while (currentIntervals.length > 0) {
    clearInterval(currentIntervals.pop());
  }
}

export function clearTimeouts() {
  while (currentSetTimeouts.length > 0) {
    clearTimeout(currentSetTimeouts.pop());
  }
}

export function AddToQueue(func) {
  queue.push({ run: func });

  if (!isQueueProcessing) {
    isQueueProcessing = true;
    ProcessQueue();
  }
}

export function cancelCurrentWorkflow(stopDevice = true) {
  stopWorkflowRuntime();
  clearIntervals();
  clearTimeouts();
  workflowGeneration++;
  resumeCallback = undefined;
  store.dispatch(setWorkflowPaused(false));
  workflowFunctions = [];
  currentWorkflowIndex = -1;
  store.dispatch(setCurrentWorkflowStepId());
  store.dispatch(setCurrentWorkflow());
  store.dispatch(setCurrentStepEllapsedTimeInSeconds(0));

  if (stopDevice && isDeviceConnected()) {
    AddToPriorityQueue(stopDeviceOutputs);
  }
}

// Each OFF is attempted independently. An accepted write is not proof of physical
// shutdown; on failure keep the last state and tell the user to use the device.
async function stopDeviceOutputs() {
  let failed = false;
  for (const [uuid, action] of [[heatOffUuid, setIsHeatOn], [fanOffUuid, setIsFanOn]]) {
    try {
      await getCharacteristic(uuid).writeValue(convertToUInt8BLE(0));
      store.dispatch(action(false));
    } catch (error) {
      failed = true;
      console.warn("Could not switch off device output", error);
    }
  }
  if (failed) {
    store.dispatch(setControlError("shutdown"));
  }
}

export function AddToPriorityQueue(func, onCancelled) {
  priorityQueue.push({ run: func, cancel: onCancelled });

  if (!isQueueProcessing) {
    isQueueProcessing = true;
    ProcessQueue();
  }
}

async function ProcessQueue() {
  isQueueProcessing = true;
  if (queue.length === 0 && priorityQueue.length === 0) {
    isQueueProcessing = false;
    return;
  }

  let timeout;
  try {
    let func;
    if (priorityQueue.length > 0) {
      func = priorityQueue.shift();
    } else {
      func = queue.shift();
    }
    timeout = setTimeout(() => {
      store.dispatch(setControlError("communication"));
      clearQueuesAndTimers();
      if (isDeviceConnected()) AddToPriorityQueue(stopDeviceOutputs);
      // Keep ownership of the worker: the timed-out GATT request cannot be
      // cancelled by Promise.race, and starting another request would overlap it.
    }, 15000);
    await func.run();
    clearTimeout(timeout);
    setTimeout(() => {
      ProcessQueue();
    }, 0);
  } catch (error) {
    clearTimeout(timeout);
    console.warn(`QUEUE ERROR: ${error.toString()}`);
    store.dispatch(setControlError("communication"));
    clearQueuesAndTimers();
    if (isDeviceConnected()) AddToPriorityQueue(stopDeviceOutputs);
    ProcessQueue();
  }
}

export function AddToWorkflowQueue(func) {
  workflowGeneration++;
  workflowFunctions = func;
  currentWorkflowIndex = -1;
  startWorkflowRuntime(() => {
    store.dispatch(setControlError("interrupted"));
    cancelCurrentWorkflow();
  });
  ProcessWorkflowQueue(workflowGeneration);
}

function ProcessWorkflowQueue(generation) {
  const next = (resetIndex) => {
    // A cancelled or superseded workflow must not keep stepping. Without this guard a
    // step that was already scheduled can still run - and a heat step would switch the
    // heater on and start a fresh watchdog after the user cancelled.
    if (generation !== workflowGeneration || !isWorkflowRuntimeCurrent()) {
      return;
    }
    if (resetIndex) {
      currentWorkflowIndex = -1;
    }
    if (currentWorkflowIndex + 1 >= workflowFunctions.length) {
      store.dispatch(setCurrentWorkflow());
      store.dispatch(setCurrentWorkflowStepId());
      store.dispatch(setCurrentStepEllapsedTimeInSeconds(0));
    }
    const currentFunc = workflowFunctions[currentWorkflowIndex + 1];
    if (!currentFunc) {
      // Completion releases runtime resources. Outputs retain the final state
      // explicitly chosen by the workflow; cancellation is an output shutdown.
      clearIntervals();
      clearTimeouts();
      stopWorkflowRuntime();
      return;
    }
    currentSetTimeouts.push(
      setTimeout(() => {
        AddToQueue(async () => {
          if (generation !== workflowGeneration || !isWorkflowRuntimeCurrent()) {
            return;
          }
          await currentFunc(next);
          // Re-check after the await: a cancel during the step's BLE write would
          // otherwise let this advance the *new* workflow's index and skip a step -
          // possibly the heat off.
          if (generation !== workflowGeneration) {
            return;
          }
          currentWorkflowIndex++;
        });
      }, 0)
    );
  };
  next();
}

export function clearQueuesAndTimers() {
  cancelCurrentWorkflow(false);
  const abandoned = [...queue.splice(0), ...priorityQueue.splice(0)];
  abandoned.forEach((entry) => entry.cancel?.(new Error("Bluetooth operation cancelled")));
  // The in-flight GATT operation still owns the worker until it settles.
}

export function AddToWorkflowCommand(func) {
  const generation = workflowGeneration;
  AddToQueue(async () => {
    if (generation === workflowGeneration && isWorkflowRuntimeCurrent()) await func();
  });
}

// Unlike window.alert this leaves Bluetooth notifications and stop controls live.
export function pauseWorkflow(next) {
  const generation = workflowGeneration;
  resumeCallback = () => {
    if (generation === workflowGeneration && isWorkflowRuntimeCurrent() && !store.getState().deviceInteraction.controlError) next();
  };
  store.dispatch(setWorkflowPaused(true));
}

export function resumeWorkflow() {
  const next = resumeCallback;
  resumeCallback = undefined;
  store.dispatch(setWorkflowPaused(false));
  next?.();
}
