import { queueAutoShutoff } from "../../../services/deviceCommands";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { AddToQueue } from "../../../services/bleQueueing";
import { convertBLEtoUint16 } from "../../../services/utils";
import { getCharacteristic } from "../../../services/BleCharacteristicCache";
import { autoShutoffSettingUuid } from "../../../constants/uuids";
import { setAutoShutoffTime } from "../settingsSlice";
import { useEffect, useState } from "react";
import SettingsRange from "../Shared/SettingsRange/SettingsRange";
import SettingsItem from "../SettingsItem";

import { useTranslation } from "react-i18next";

export default function AdjustAutoShutoffTimeContainer() {
  const { t } = useTranslation();
  const autoShutoffTime = useSelector(
    (state) => state.settings.autoShutoffTime
  );

  const [draft, setDraft] = useState(undefined);
  const dispatch = useDispatch();
  useEffect(() => {
    if (autoShutoffTime === undefined) {
      const blePayload = async () => {
        const characteristic = getCharacteristic(autoShutoffSettingUuid);
        const value = await characteristic.readValue();
        const normalizedValue = convertBLEtoUint16(value) / 60;
        dispatch(setAutoShutoffTime(normalizedValue));
      };
      AddToQueue(blePayload);
    }
  }, [autoShutoffTime, dispatch]);

  const onMouseUp = (values) => queueAutoShutoff(values[0]);
  const onChange = (values) => setDraft(values[0]);

  return (
    <SettingsItem
      title={t('settings.items.autoShutoffTimer.title')}
      description={t('settings.items.autoShutoffTimer.description')}
    >
      <div>
        Current Time: {draft ?? autoShutoffTime} minutes
        <SettingsRange
          values={[draft ?? Math.min(360, Math.max(5, autoShutoffTime || 30))]}
          step={5}
          min={5}
          max={360}
          onChange={onChange}
          onFinalChange={onMouseUp}
        />
      </div>
    </SettingsItem>
  );
}
