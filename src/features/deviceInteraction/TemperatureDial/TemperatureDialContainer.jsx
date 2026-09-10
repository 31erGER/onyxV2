import { queueTemperature } from "../../../services/deviceCommands";

import { useDispatch, useSelector } from "react-redux";
import TemperatureDial from "./TemperatureDial";
import { getCharacteristic } from "../../../services/BleCharacteristicCache";
import { register2Uuid } from "../../../constants/uuids";
import { AddToPriorityQueue } from "../../../services/bleQueueing";
import { convertToUInt32BLE } from "../../../services/utils";
import { fahrenheitMask, celciusMask } from "../../../constants/masks";

import { setIsF } from "../../settings/settingsSlice";

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

  const onTargetCommit = (celsius) => queueTemperature(celsius);

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
