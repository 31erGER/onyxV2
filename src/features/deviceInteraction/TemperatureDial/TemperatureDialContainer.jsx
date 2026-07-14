import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import TemperatureDial from "./TemperatureDial";
import { getCharacteristic } from "../../../services/BleCharacteristicCache";
import {
  currentTemperatureUuid,
  register2Uuid,
  writeTemperatureUuid,
  heatOnUuid,
} from "../../../constants/uuids";
import { AddToQueue, AddToPriorityQueue } from "../../../services/bleQueueing";
import {
  convertCurrentTemperatureCharacteristicToCelcius,
  convertToUInt32BLE,
  convertToUInt8BLE,
} from "../../../services/utils";
import { fahrenheitMask, celciusMask } from "../../../constants/masks";
import {
  setCurrentTemperature,
  setTargetTemperature,
  setIsHeatOn,
} from "../deviceInteractionSlice";
import { setIsF } from "../../settings/settingsSlice";
import store from "../../../store";

export default function TemperatureDialContainer() {
  const dispatch = useDispatch();
  const isF = useSelector((state) => state.settings.isF);
  const isHeatOn = useSelector((state) => state.deviceInteraction.isHeatOn);
  const currentTemperature = useSelector(
    (state) => state.deviceInteraction.currentTemperature
  );
  const targetTemperature = useSelector(
    (state) => state.deviceInteraction.targetTemperature
  );

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible") {
        setTimeout(() => {
          const blePayload = async () => {
            const characteristic = getCharacteristic(currentTemperatureUuid);
            const value = await characteristic.readValue();
            const normalizedValue =
              convertCurrentTemperatureCharacteristicToCelcius(value);
            if (
              store.getState().deviceInteraction.currentTemperature !==
              normalizedValue
            ) {
              dispatch(setCurrentTemperature(normalizedValue));
            }
          };
          AddToQueue(blePayload);
        }, 250);
      }
    };

    document.addEventListener("visibilitychange", handler);

    return () => {
      document.removeEventListener("visibilitychange", handler);
    };
  }, [dispatch]);

  useEffect(() => {
    const characteristic = getCharacteristic(currentTemperatureUuid);
    const onCharacteristicChange = (event) => {
      const currentTemperature =
        convertCurrentTemperatureCharacteristicToCelcius(event.target.value);
      if (
        store.getState().deviceInteraction.currentTemperature !==
        currentTemperature
      ) {
        dispatch(setCurrentTemperature(currentTemperature));
      }
    };
    const BlePayload = async () => {
      await characteristic.addEventListener(
        "characteristicvaluechanged",
        onCharacteristicChange
      );
      await characteristic.startNotifications();
      const value = await characteristic.readValue();
      const normalizedValue =
        convertCurrentTemperatureCharacteristicToCelcius(value);

      if (
        store.getState().deviceInteraction.currentTemperature !==
        normalizedValue
      ) {
        dispatch(setCurrentTemperature(normalizedValue));
      }
    };
    AddToQueue(BlePayload);
    return () => {
      const blePayload = async () => {
        await characteristic?.removeEventListener(
          "characteristicvaluechanged",
          onCharacteristicChange
        );
      };
      AddToQueue(blePayload);
    };
  }, [dispatch]);

  const handleTemperatureUnitToggle = () => {
    const blePayload = async () => {
      try {
        const characteristicPrj2V = getCharacteristic(register2Uuid);
        if (!characteristicPrj2V) {
          console.error("Register2 characteristic not found");
          return;
        }

        const mask = isF ? celciusMask : fahrenheitMask;
        const buffer = convertToUInt32BLE(mask);
        await characteristicPrj2V.writeValue(buffer);
        dispatch(setIsF(!isF));
      } catch (error) {
        console.error("Error toggling temperature units:", error);
      }
    };
    AddToPriorityQueue(blePayload);
  };

  const onTargetCommit = (celsius) => {
    dispatch(setTargetTemperature(celsius));
    const blePayload = async () => {
      const characteristic = getCharacteristic(writeTemperatureUuid);
      const buffer = convertToUInt32BLE(celsius * 10);
      await characteristic.writeValue(buffer);
    };
    AddToQueue(blePayload);

    if (!isHeatOn) {
      const heatPayload = async () => {
        const characteristic = getCharacteristic(heatOnUuid);
        const buffer = convertToUInt8BLE(0);
        await characteristic.writeValue(buffer);
        dispatch(setIsHeatOn(true));
      };
      AddToPriorityQueue(heatPayload);
    }
  };

  return (
    <TemperatureDial
      currentTemperature={currentTemperature}
      targetTemperature={targetTemperature}
      isF={isF}
      isHeatOn={isHeatOn}
      onTargetCommit={onTargetCommit}
      onCenterClick={handleTemperatureUnitToggle}
    />
  );
}
