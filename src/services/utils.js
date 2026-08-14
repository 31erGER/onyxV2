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
  const buffer = new ArrayBuffer(1);
  const dataView = new DataView(buffer);
  dataView.setUint8(0, val % 256);
  return buffer;
}

export function convertBLEtoUint16(bleBuf) {
  return bleBuf.getUint8(0) + bleBuf.getUint8(1) * 256;
}

export function convertToUInt16BLE(val) {
  // Without this clamp a value of 65536 wraps silently to 0. For the auto shutoff
  // setting that would mean writing "no shutoff" to the device.
  const safeValue = Math.min(Math.max(Math.round(val) || 0, 0), 65535);
  const buffer = new ArrayBuffer(2);
  const dataView = new DataView(buffer);
  dataView.setUint8(0, safeValue % 256);
  dataView.setUint8(1, Math.floor(safeValue / 256));

  return buffer;
}

export function convertToUInt32BLE(val) {
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

export function convertToggleCharacteristicToBool(value, mask) {
  if ((value & mask) === 0) {
    return false;
  }
  return true;
}

// Returns null when the device reported a value that cannot be a real temperature.
// Reporting an unusable reading as a low temperature would be dangerous: the heat
// watchdog reads it as "still cold" and keeps heating. Callers must keep their last
// known good value instead of trusting a null.
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

  // Anything above the highest settable target is passed through unchanged rather than
  // smoothed away. A genuine overshoot has to stay visible: it satisfies the "target
  // reached" check and therefore stops the heating instead of prolonging it.
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
  if (isNaN(value)) {
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
