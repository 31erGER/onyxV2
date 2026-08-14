import {
  setCurrentWorkflow,
  setCurrentWorkflowStepId,
  setCurrentStepEllapsedTimeInSeconds,
} from "../features/workflowEditor/workflowSlice";
import store from "../store";

import { getCharacteristic } from "./BleCharacteristicCache";
import { fanOffUuid } from "../constants/uuids";
import { convertToUInt8BLE } from "./utils";

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
  queue.push(func);

  if (!isQueueProcessing) {
    isQueueProcessing = true;
    ProcessQueue();
  }
}

export function cancelCurrentWorkflow(turnFanOff = true) {
  clearIntervals();
  clearTimeouts();
  workflowGeneration++;
  workflowFunctions = [];
  currentWorkflowIndex = -1;
  store.dispatch(setCurrentWorkflowStepId());
  store.dispatch(setCurrentWorkflow());
  store.dispatch(setCurrentStepEllapsedTimeInSeconds(0));

  if (turnFanOff) {
    const blePayload = async () => {
      const fanOffCharacteristic = getCharacteristic(fanOffUuid);
      const buffer = convertToUInt8BLE(0);
      await fanOffCharacteristic.writeValue(buffer);
    };
    AddToQueue(blePayload);
  }
}

export function AddToPriorityQueue(func) {
  priorityQueue.push(func);

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

  try {
    let func;
    if (priorityQueue.length > 0) {
      func = priorityQueue.shift();
    } else {
      func = queue.shift();
    }
    await func();
    setTimeout(() => {
      ProcessQueue();
    }, 0);
  } catch (error) {
    console.log(`QUEUE ERROR: ${error.toString()}`);
    if (
      error.toString().includes("Characteristic not found in cache") ||
      error.toString().includes("not known for service")
    ) {
      window.location.reload();
    }
    ProcessQueue();
  }
}

export function AddToWorkflowQueue(func) {
  workflowGeneration++;
  workflowFunctions = func;
  currentWorkflowIndex = -1;
  ProcessWorkflowQueue(workflowGeneration);
}

function ProcessWorkflowQueue(generation) {
  const next = (resetIndex) => {
    // A cancelled or superseded workflow must not keep stepping. Without this guard a
    // step that was already scheduled can still run - and a heat step would switch the
    // heater on and start a fresh watchdog after the user cancelled.
    if (generation !== workflowGeneration) {
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
      // The workflow ran to its end. Make sure no heat watchdog survives it - one that
      // outlives its workflow would keep re-enabling the heater in the background.
      clearIntervals();
      clearTimeouts();
      return;
    }
    currentSetTimeouts.push(
      setTimeout(() => {
        AddToQueue(async () => {
          if (generation !== workflowGeneration) {
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
  queue.length = 0;
  priorityQueue.length = 0;
  isQueueProcessing = false;
}
