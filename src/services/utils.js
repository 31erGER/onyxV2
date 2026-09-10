import {
  MIN_CELSIUS_TEMP,
  MAX_CELSIUS_TEMP,
  MIN_READABLE_CELSIUS_TEMP,
  MAX_PLAUSIBLE_CELSIUS_TEMP,
  DEGREE_SYMBOL,
} from "../constants/temperature";
import WorkflowItemTypes from "../constants/enums";

import {
  localStorageKey,
  defaultTemperatureArray,
  defaultGlobalFanOnTimeInSeconds,
  defaultWorkflows,
} from "../constants/constants";

import { migrateLegacyConfig } from "./configMigration";

// Language configuration
export const SUPPORTED_LANGUAGES = ['en', 'fr', 'es', 'de', 'pl', 'binary', 'elvish'];

export function convertToUInt8BLE(val) {
  assertUnsignedValue(val, 255);
  const buffer = new ArrayBuffer(1);
  const dataView = new DataView(buffer);
  dataView.setUint8(0, val % 256);
  return buffer;
}

export function convertBLEtoUint16(bleBuf) {
  return bleBuf.getUint8(0) + bleBuf.getUint8(1) * 256;
}

export function convertToUInt16BLE(val) {
  assertUnsignedValue(val, 65535);
  const safeValue = Math.round(val);
  const buffer = new ArrayBuffer(2);
  const dataView = new DataView(buffer);
  dataView.setUint8(0, safeValue % 256);
  dataView.setUint8(1, Math.floor(safeValue / 256));

  return buffer;
}

export function convertToUInt32BLE(val) {
  assertUnsignedValue(val, 4294967295);
  val = Math.round(val);
  const buffer = new ArrayBuffer(4);
  const dataView = new DataView(buffer);
  dataView.setUint8(0, val & 255);
  let tempVal = val >> 8;
  dataView.setUint8(1, tempVal & 255);
  tempVal = tempVal >> 8;
  dataView.setUint8(2, tempVal & 255);
  tempVal = tempVal >> 8;
  dataView.setUint8(3, tempVal & 255);

  return buffer;
}

function assertUnsignedValue(value, maximum) {
  if (!Number.isFinite(value) || value < 0 || value > maximum) {
    throw new RangeError("Invalid unsigned Bluetooth value");
  }
}

// Application limit, not a hardware guarantee. Also avoids setTimeout overflow.
export function isValidWorkflowDuration(value) {
  return Number.isFinite(value) && value >= 0 && value <= 6 * 60 * 60;
}

export function convertToggleCharacteristicToBool(value, mask) {
  if ((value & mask) === 0) {
    return false;
  }
  return true;
}

// Invalid sensor data is not a cold reading. Device telemetry must abort automatic
// control when this returns null; a retained display value is not fresh evidence.
export function convertCurrentTemperatureCharacteristicToCelcius(value) {
  const result = Math.round(convertBLEtoUint16(value) / 10);

  // Sensor error codes arrive as very large raw values (0xFFFF and friends) and mean
  // "no usable reading", not "cold".
  if (
    result < MIN_READABLE_CELSIUS_TEMP ||
    result > MAX_PLAUSIBLE_CELSIUS_TEMP
  ) {
    return null;
  }

  // Preserve measured overshoot for display and target-reached checks. Reaching
  // a target completes the step; it is not proof that the heater switched off.
  return result;
}

export function convertToFahrenheitFromCelsius(celsius) {
  return Math.round(celsius * 1.8 + 32);
}

export function convertToCelsiusFromFahrenheit(fahrenheit) {
  return Math.round((fahrenheit - 32) * (5 / 9));
}

export function getDisplayTemperature(temperature, isF) {
  const temperatureAbbreviation = isF ? "F" : "C";
  const normalizedTemperature = isF
    ? convertToFahrenheitFromCelsius(temperature)
    : temperature;

  return `${normalizedTemperature}${DEGREE_SYMBOL}${temperatureAbbreviation}`;
}

export function isValueInValidVolcanoCelciusRange(value) {
  if (!Number.isFinite(value)) {
    return false;
  }

  return !(value > MAX_CELSIUS_TEMP || value < MIN_CELSIUS_TEMP);
}

export function ReadConfigFromLocalStorage() {
  let config = JSON.parse(window.localStorage.getItem(localStorageKey));
  const defaultConfig = {
    temperatureControlValues: defaultTemperatureArray,
    workflows: {
      items: defaultWorkflows,
      [WorkflowItemTypes.FAN_ON_GLOBAL]: defaultGlobalFanOnTimeInSeconds,
    },
    onConnectTurnHeatOn: false,
    isMinimalistMode: false,
  };
  if (!config) {
    window.localStorage.setItem(localStorageKey, JSON.stringify(defaultConfig));
    config = defaultConfig;
  } else {
    config = { ...defaultConfig, ...config };
    if (!config.workflows.items) {
      config.workflows = {
        items: config.workflows,
        [WorkflowItemTypes.FAN_ON_GLOBAL]: defaultGlobalFanOnTimeInSeconds,
      };
    }
  }

  config = migrateLegacyConfig(config);
  window.localStorage.setItem(localStorageKey, JSON.stringify(config));

  return config;
}

export function WriteNewConfigToLocalStorage(config) {
  const comparer = function (a, b) {
    return a - b;
  };

  const sortedTemperatureControlValues = [
    ...config.temperatureControlValues,
  ].sort(comparer);

  const sortedTemperatureConfig = {
    ...config,
    temperatureControlValues: sortedTemperatureControlValues,
  };

  window.localStorage.setItem(
    localStorageKey,
    JSON.stringify(sortedTemperatureConfig)
  );
}
