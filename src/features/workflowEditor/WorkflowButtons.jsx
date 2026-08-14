import {
  heatOnUuid,
  fanOnUuid,
  fanOffUuid,
  heatOffUuid,
  writeTemperatureUuid,
  LEDbrightnessUuid,
  currentTemperatureUuid,
} from "../../constants/uuids";
import WriteTemperature from "../deviceInteraction/WriteTemperature/WriteTemperature";

import {
  convertToUInt8BLE,
  convertToUInt32BLE,
  convertToUInt16BLE,
  isValueInValidVolcanoCelciusRange,
  convertCurrentTemperatureCharacteristicToCelcius,
} from "../../services/utils";
import {
  AddToQueue,
  AddToPriorityQueue,
  AddToWorkflowQueue,
  getWorkflowGeneration,
} from "../../services/bleQueueing";
import {
  heatWatchdogPollIntervalInMilliseconds,
  heatWatchdogTimeoutInMilliseconds,
  maxHeatOnResendAttempts,
  heatOnConfirmationGraceInMilliseconds,
} from "../../constants/constants";
import {
  setCurrentTemperature,
  setIsHeatOn,
  setTargetTemperature,
} from "../deviceInteraction/deviceInteractionSlice";
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
    currentSetTimeouts.push(
      setTimeout(() => {
        func();
      }, timeout)
    );
  };

  const turnFanOff = async (next) => {
    const blePayload = async () => {
      const characteristic = getCharacteristic(fanOffUuid);
      const buffer = convertToUInt8BLE(0);
      await characteristic.writeValue(buffer);

      executeWithManagedSetTimeout(next);
    };
    AddToQueue(blePayload);
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
    AddToQueue(blePayload);
  };

  // Emergency stop - jumps the queue so a backlog of heat steps cannot delay it.
  const turnHeatOffImmediately = () => {
    const blePayload = async () => {
      const characteristic = getCharacteristic(heatOffUuid);
      const buffer = convertToUInt8BLE(0);
      await characteristic.writeValue(buffer);
      dispatch(setIsHeatOn(false));
    };
    AddToPriorityQueue(blePayload);
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

    AddToQueue(blePayload);
  };

  // Polls until the device reports it reached targetTemperature, keeping the heater on
  // in the meantime. targetTemperature must already be a valid celcius value - a step
  // without a usable target must never start a watchdog, because the "reached" check
  // would never become true and the heater would be forced back on forever.
  const startHeatWatchdog = (targetTemperature, onTargetReached) => {
    const watchdogStartedAt = Date.now();
    const watchdogGeneration = getWorkflowGeneration();
    let previousTemperature;
    let sameTemperatureIntervalStreak = 0;
    let isWatchdogFinished = false;
    let hasConfirmedHeatOn = false;
    let heatOnResendCount = 0;

    // Several polls can already sit in the BLE queue when the target is reached, so
    // this guard makes sure the workflow only ever advances once per heat step.
    const finishWatchdog = (onFinished) => {
      if (isWatchdogFinished) {
        return;
      }
      isWatchdogFinished = true;
      clearIntervals();
      clearTimeouts();
      onFinished();
    };

    currentIntervals.push(
      setInterval(() => {
        const blePayload = async () => {
          // Polls queued before a cancel would otherwise still reach the device.
          if (isWatchdogFinished || getWorkflowGeneration() !== watchdogGeneration) {
            return;
          }

          if (
            Date.now() - watchdogStartedAt >
            heatWatchdogTimeoutInMilliseconds
          ) {
            console.warn(
              "Heat step did not reach its target temperature in time - turning the heater off and aborting the workflow."
            );
            finishWatchdog(() => {
              turnHeatOffImmediately();
              cancelCurrentWorkflow();
            });
            return;
          }

          const currentTemperature =
            store.getState().deviceInteraction.currentTemperature;

          if (previousTemperature !== currentTemperature) {
            previousTemperature = currentTemperature;
            sameTemperatureIntervalStreak = 0;
          } else {
            sameTemperatureIntervalStreak++;
          }

          //this is arbitrary.  If the on change event is missed heat will hang forever waiting for the target temperature to be reach (even tho it is on the device)
          //I thought it we read the same temperature 7 times in a row then we should probably reach out to the device.
          if (sameTemperatureIntervalStreak > 7) {
            sameTemperatureIntervalStreak = 0;
            const blePayload = async () => {
              const temperatureCharacteristic = getCharacteristic(
                currentTemperatureUuid
              );
              const value = await temperatureCharacteristic.readValue();
              const currentTemperature =
                convertCurrentTemperatureCharacteristicToCelcius(value);
              if (currentTemperature === null) {
                return;
              }
              dispatch(setCurrentTemperature(currentTemperature));
              previousTemperature = currentTemperature;
              sameTemperatureIntervalStreak = 0;
            };

            AddToQueue(blePayload);
          }

          if (currentTemperature >= targetTemperature) {
            finishWatchdog(onTargetReached);
            return;
          }

          // if the temperature is changed to be below the target we will never get there.
          // The workflow must continue onward by any means necessary, therefore we shall set the payload temperature again
          if (
            store.getState().deviceInteraction.targetTemperature <
            targetTemperature
          ) {
            writeTargetTemperatureToDevice(targetTemperature);
          }

          if (store.getState().deviceInteraction.isHeatOn) {
            hasConfirmedHeatOn = true;
          } else if (
            hasConfirmedHeatOn ||
            Date.now() - watchdogStartedAt > heatOnConfirmationGraceInMilliseconds
          ) {
            // The device says the heater is off, and it has either confirmed it was
            // running before or it has had long enough to report itself on. That is the
            // device's own auto shutoff, an overheat lockout, or somebody pressing a
            // heat button - all of them are stop requests and all of them must win.
            // Switching the heater back on here would override the device's last line
            // of defense, which is exactly what causes an overheat error.
            console.warn(
              "Heater was switched off by the device or by the user - aborting the workflow."
            );
            finishWatchdog(() => cancelCurrentWorkflow());
            return;
          } else if (heatOnResendCount < maxHeatOnResendAttempts) {
            // Still inside the startup grace period: our initial command may simply not
            // have arrived yet. Retry a bounded number of times, never indefinitely.
            heatOnResendCount++;
            turnHeatOn(
              () =>
                !isWatchdogFinished &&
                getWorkflowGeneration() === watchdogGeneration
            );
          }
        };
        AddToQueue(blePayload);
      }, heatWatchdogPollIntervalInMilliseconds)
    );
  };

  const onClick = (workflowIndex) => {
    const nextWorkflow = workflows[workflowIndex];
    const isCancelRequest = nextWorkflow.id === currentWorkflow?.id;
    cancelCurrentWorkflow();
    if (isCancelRequest) {
      return;
    }

    dispatch(setCurrentWorkflow(nextWorkflow));
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

            // A heat step without a usable target temperature (empty, null or out of
            // range) just switches the heater on - there is nothing to wait for.
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

            // A failed write must not abandon the chain: the following steps usually
            // contain the heat off, so the workflow has to keep going regardless.
            try {
              const characteristic = getCharacteristic(fanOnUuid);
              const buffer = convertToUInt8BLE(0);
              await characteristic.writeValue(buffer);
            } catch (error) {
              console.warn(`Could not turn the fan on: ${error}`);
            }

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

            try {
              const characteristic = getCharacteristic(heatOffUuid);
              const buffer = convertToUInt8BLE(0);
              await characteristic.writeValue(buffer);
              dispatch(setIsHeatOn(false));
            } catch (error) {
              // Retry once - this is the step that leaves the device in a safe state.
              console.warn(`Could not turn the heat off, retrying: ${error}`);
              turnHeatOffImmediately();
            }
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
              executeWithManagedSetTimeout(next);
              return;
            }

            const stepGeneration = getWorkflowGeneration();
            writeTargetTemperatureToDevice(nextTemp);
            turnHeatOn(() => getWorkflowGeneration() === stepGeneration);
            startHeatWatchdog(nextTemp, () => {
              if (nextWait === 0) {
                alert(t("workflow.clickOkayToResume"));
                executeWithManagedSetTimeout(next);
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
              alert(t('workflow.clickOkayToResume'));
            }

            executeWithManagedSetTimeout(next, item.payload * 1000);
          };
        }
        case WorkflowItemTypes.SET_LED_BRIGHTNESS: {
          return async (next) => {
            dispatch(setCurrentWorkflowStepId(index + 1));

            const blePayload = async () => {
              const characteristic = getCharacteristic(LEDbrightnessUuid);
              const buffer = convertToUInt16BLE(item.payload);
              await characteristic.writeValue(buffer);
              dispatch(setLEDbrightness(item.payload));
              executeWithManagedSetTimeout(next, 200);
            };

            AddToQueue(blePayload);
          };
        }
        default:
          return async (next) => {
            dispatch(setCurrentWorkflowStepId(index + 1));
            executeWithManagedSetTimeout(next);
          };
      }
    });

    AddToWorkflowQueue(thoughtData);
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
