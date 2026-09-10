import { isWorkflowRuntimeCurrent } from "../../services/workflowRuntime";
import {
  heatOnUuid,
  fanOnUuid,
  fanOffUuid,
  heatOffUuid,
  writeTemperatureUuid,
  LEDbrightnessUuid,
  currentTemperatureUuid,
  register1Uuid,
} from "../../constants/uuids";
import WriteTemperature from "../deviceInteraction/WriteTemperature/WriteTemperature";

import {
  convertToUInt8BLE,
  convertToUInt32BLE,
  convertToUInt16BLE,
  isValueInValidVolcanoCelciusRange,
  convertCurrentTemperatureCharacteristicToCelcius,
  convertBLEtoUint16,
} from "../../services/utils";
import {
  AddToWorkflowCommand,
  AddToPriorityQueue,
  AddToWorkflowQueue,
  getWorkflowGeneration,
} from "../../services/bleQueueing";
import {
  heatWatchdogPollIntervalInMilliseconds,
  heatWatchdogTimeoutInMilliseconds,
  heatOnConfirmationGraceInMilliseconds,
} from "../../constants/constants";
import {
  setCurrentTemperature,
  setIsHeatOn,
  setTargetTemperature,
} from "../deviceInteraction/deviceInteractionSlice";
import { heatingMask } from "../../constants/masks";
import WorkflowConfigValidator from "./WorkflowConfigEditor.jsx/workflowConfigValidator";
import WorkflowItemTypes from "../../constants/enums";
import { getCharacteristic } from "../../services/BleCharacteristicCache";
import { useDispatch, useSelector } from "react-redux";
import { setLEDbrightness } from "../settings/settingsSlice";
import { setCurrentWorkflowStepId, setCurrentWorkflow } from "./workflowSlice";
import store from "../../store";
import {
  currentSetTimeouts,
  currentIntervals,
  cancelCurrentWorkflow,
  clearIntervals,
  clearTimeouts,
  pauseWorkflow,
} from "../../services/bleQueueing";
import PrideText from "../../themes/PrideText";
import { useTranslation } from "react-i18next";
export default function WorkFlow() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const fanOnGlobal = useSelector(
    (state) => state.settings.config.workflows.fanOnGlobal
  );
  const workflows = useSelector(
    (state) => state.settings.config.workflows.items
  );

  const highlightLastRunWorkflow = useSelector(
    (state) => state.settings.config.highlightLastRunWorkflow
  );
  const currentWorkflow = useSelector(
    (state) => state.workflow.currentWorkflow
  );

  const lastWorkflowRunId = useSelector(
    (state) => state.workflow.lastWorkflowRunId
  );

  const executeWithManagedSetTimeout = (func, timeout = 100) => {
    const generation = getWorkflowGeneration();
    currentSetTimeouts.push(
      setTimeout(() => {
        if (generation !== getWorkflowGeneration() || !isWorkflowRuntimeCurrent()) return;
        func();
      }, timeout)
    );
  };

  const turnFanOff = async (next) => {
    const generation = getWorkflowGeneration();
    const blePayload = async () => {
      const characteristic = getCharacteristic(fanOffUuid);
      const buffer = convertToUInt8BLE(0);
      await characteristic.writeValue(buffer);
      if (generation !== getWorkflowGeneration()) return;
      executeWithManagedSetTimeout(next);
    };
    AddToWorkflowCommand(blePayload);
  };

  // isStillWanted is re-checked at write time, not at queue time. A heat-on that was
  // queued before a cancel or an abort must never reach the device afterwards.
  const turnHeatOn = (isStillWanted = () => true) => {
    const blePayload = async () => {
      if (!isStillWanted()) {
        return;
      }
      const characteristic = getCharacteristic(heatOnUuid);
      const buffer = convertToUInt8BLE(0);
      await characteristic.writeValue(buffer);
    };
    AddToWorkflowCommand(blePayload);
  };

  const writeTargetTemperatureToDevice = (temperature) => {
    const blePayload = async () => {
      if (isValueInValidVolcanoCelciusRange(temperature)) {
        const characteristic = getCharacteristic(writeTemperatureUuid);
        const buffer = convertToUInt32BLE(temperature * 10);
        await characteristic.writeValue(buffer);
        dispatch(setTargetTemperature(temperature));
      }
    };

    AddToWorkflowCommand(blePayload);
  };

  // Observe fresh device data. Never retry ON or restore a target changed by
  // the user/device: either could override a physical stop or firmware lockout.
  const startHeatWatchdog = (targetTemperature, onTargetReached) => {
    const startedAt = Date.now();
    const generation = getWorkflowGeneration();
    let finished = false;
    let pending = false;
    let confirmedHeat = false;
    const active = () => !finished && generation === getWorkflowGeneration() && isWorkflowRuntimeCurrent();
    const finish = (callback) => {
      if (!active()) return;
      finished = true;
      clearIntervals();
      clearTimeouts();
      callback();
    };
    currentIntervals.push(setInterval(() => {
      if (!active() || pending) return;
      if (Date.now() - startedAt > heatWatchdogTimeoutInMilliseconds) {
        finish(() => cancelCurrentWorkflow());
        return;
      }
      pending = true;
      AddToWorkflowCommand(async () => {
        try {
          if (!active()) return;
          const status = convertBLEtoUint16(await getCharacteristic(register1Uuid).readValue());
          if (!active()) return;
          const heatOn = (status & heatingMask) !== 0;
          dispatch(setIsHeatOn(heatOn));
          if (!heatOn && (confirmedHeat || Date.now() - startedAt > heatOnConfirmationGraceInMilliseconds)) {
            finish(() => cancelCurrentWorkflow());
            return;
          }
          confirmedHeat ||= heatOn;
          const current = convertCurrentTemperatureCharacteristicToCelcius(
            await getCharacteristic(currentTemperatureUuid).readValue());
          if (!active()) return;
          if (current === null) {
            finish(() => cancelCurrentWorkflow());
            return;
          }
          dispatch(setCurrentTemperature(current));
          const target = convertCurrentTemperatureCharacteristicToCelcius(
            await getCharacteristic(writeTemperatureUuid).readValue());
          if (!active()) return;
          if (target === null || Math.abs(target - targetTemperature) > 0.5) {
            finish(() => cancelCurrentWorkflow());
            return;
          }
          if (heatOn && current >= targetTemperature) finish(onTargetReached);
        } finally {
          pending = false;
        }
      });
    }, heatWatchdogPollIntervalInMilliseconds));
  };

  const onClick = (workflowIndex) => {
    const nextWorkflow = workflows[workflowIndex];
    if (!nextWorkflow) return;
    const isCancelRequest = nextWorkflow.id === currentWorkflow?.id;
    cancelCurrentWorkflow();
    if (isCancelRequest) {
      return;
    }

    if (!WorkflowConfigValidator({ items: [nextWorkflow], fanOnGlobal })) {
      alert(t("workflow.invalidConfiguration"));
      return;
    }
    const startGeneration = getWorkflowGeneration();
    const thoughtData = nextWorkflow.payload.map((item, index) => {
      switch (item.type) {
        case WorkflowItemTypes.HEAT_ON: {
          return async (next) => {
            dispatch(setCurrentWorkflowStepId(index + 1));

            // Cancelling between queueing these writes and them reaching the device
            // must stop them - otherwise a cancelled step still starts the heater.
            const stepGeneration = getWorkflowGeneration();
            const isStepStillWanted = () =>
              getWorkflowGeneration() === stepGeneration;

            // The validator allows an explicitly empty target for an ON-only step.
            if (!isValueInValidVolcanoCelciusRange(item.payload)) {
              turnHeatOn(isStepStillWanted);
              executeWithManagedSetTimeout(next);
              return;
            }

            writeTargetTemperatureToDevice(item.payload);
            turnHeatOn(isStepStillWanted);
            startHeatWatchdog(item.payload, () =>
              executeWithManagedSetTimeout(next)
            );
          };
        }
        case WorkflowItemTypes.FAN_ON_GLOBAL:
        case WorkflowItemTypes.FAN_ON: {
          return async (next) => {
            dispatch(setCurrentWorkflowStepId(index + 1));

            const stepGeneration = getWorkflowGeneration();
            const characteristic = getCharacteristic(fanOnUuid);
            await characteristic.writeValue(convertToUInt8BLE(0));
            if (stepGeneration !== getWorkflowGeneration()) return;

            const fanOnTime =
              item.type === WorkflowItemTypes.FAN_ON_GLOBAL
                ? fanOnGlobal
                : item.payload;
            if (fanOnTime === 0) {
              executeWithManagedSetTimeout(next);
            } else {
              executeWithManagedSetTimeout(
                () => turnFanOff(next),
                fanOnTime * 1000
              );
            }
          };
        }
        case WorkflowItemTypes.HEAT_OFF: {
          return async (next) => {
            dispatch(setCurrentWorkflowStepId(index + 1));

            const stepGeneration = getWorkflowGeneration();
            const characteristic = getCharacteristic(heatOffUuid);
            await characteristic.writeValue(convertToUInt8BLE(0));
            if (stepGeneration !== getWorkflowGeneration()) return;
            dispatch(setIsHeatOn(false));
            executeWithManagedSetTimeout(next);
          };
        }
        case WorkflowItemTypes.EXIT_WORKFLOW_WHEN_TARGET_TEMPERATURE_IS: {
          return async (next) => {
            if (
              store.getState().deviceInteraction.targetTemperature ===
              item.payload
            ) {
              cancelCurrentWorkflow();
              return;
            }
            executeWithManagedSetTimeout(next);
          };
        }
        case WorkflowItemTypes.LOOP_FROM_BEGINNING: {
          return async (next) => {
            dispatch(setCurrentWorkflowStepId(1));
            executeWithManagedSetTimeout(() => next(true));
            return;
          };
        }
        case WorkflowItemTypes.HEAT_ON_WITH_CONDITIONS: {
          return async (next) => {
            const payload = item.payload;
            dispatch(setCurrentWorkflowStepId(index + 1));
            const currentTargetTemperature =
              store.getState().deviceInteraction.targetTemperature;
            const nextCondition = payload.conditions.find(
              (x) => x.ifTemp === currentTargetTemperature
            );
            const nextTemp = nextCondition
              ? nextCondition.nextTemp
              : payload.default.temp;
            const nextWait = nextCondition
              ? nextCondition.wait
              : payload.default.wait;
            // A malformed condition can leave us without a usable target temperature.
            // Skipping the step is the only safe option - waiting for a target that can
            // never be reached would keep the heater on indefinitely.
            if (!isValueInValidVolcanoCelciusRange(nextTemp)) {
              cancelCurrentWorkflow();
              return;
            }

            const stepGeneration = getWorkflowGeneration();
            writeTargetTemperatureToDevice(nextTemp);
            turnHeatOn(() => getWorkflowGeneration() === stepGeneration);
            startHeatWatchdog(nextTemp, () => {
              if (nextWait === 0) {
                pauseWorkflow(() => executeWithManagedSetTimeout(next));
                return;
              }

              if (!nextWait) {
                executeWithManagedSetTimeout(next);
                return;
              }
              executeWithManagedSetTimeout(next, nextWait * 1000);
            });
          };
        }
        case WorkflowItemTypes.WAIT: {
          return async (next) => {
            dispatch(setCurrentWorkflowStepId(index + 1));

            if (item.payload === 0) {
              pauseWorkflow(() => executeWithManagedSetTimeout(next));
              return;
            }

            executeWithManagedSetTimeout(next, item.payload * 1000);
          };
        }
        case WorkflowItemTypes.SET_LED_BRIGHTNESS: {
          return async (next) => {
            dispatch(setCurrentWorkflowStepId(index + 1));

            const generation = getWorkflowGeneration();
            const blePayload = async () => {
              const characteristic = getCharacteristic(LEDbrightnessUuid);
              const buffer = convertToUInt16BLE(item.payload);
              await characteristic.writeValue(buffer);
              if (generation !== getWorkflowGeneration()) return;
              dispatch(setLEDbrightness(item.payload));
              executeWithManagedSetTimeout(next, 200);
            };

            AddToWorkflowCommand(blePayload);
          };
        }
        default:
          return async (next) => {
            dispatch(setCurrentWorkflowStepId(index + 1));
            executeWithManagedSetTimeout(next);
          };
      }
    });

    // The cancellation OFF writes must finish before the replacement workflow is
    // marked active, otherwise their notifications look like a new device stop.
    AddToPriorityQueue(async () => {
      if (startGeneration !== getWorkflowGeneration() ||
          store.getState().deviceInteraction.controlError) return;
      dispatch(setCurrentWorkflow(nextWorkflow));
      AddToWorkflowQueue(thoughtData);
    });
  };

  return (
    <div className="temperature-write-div">
      {workflows.map((item, index) => {
        const isActive = currentWorkflow?.id === item.id;
        const isLastRunWorkflow = item.id === lastWorkflowRunId && !isActive;
        const buttonText = isActive ? t('workflow.tapToCancel') : item.name;
        return (
          <WriteTemperature
            key={index}
            onClick={() => onClick(index)}
            buttonText={<PrideText text={buttonText} />}
            isActive={isActive}
            isGlowy={highlightLastRunWorkflow && isLastRunWorkflow}
          />
        );
      })}
    </div>
  );
}
