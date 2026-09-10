import { beginTemperatureIntent, getTemperatureIntent, queueTemperature } from "../../../services/deviceCommands";
import { getWorkflowGeneration } from "../../../services/bleQueueing";
import { useEffect, useRef } from "react";

import { isValueInValidVolcanoCelciusRange } from "../../../services/utils";
import PlusMinusButton from "./PlusMinusButton";

import debounce from "lodash/debounce";
import { temperatureIncrementedDecrementedDebounceTime } from "../../../constants/constants";
import { useSelector } from "react-redux";

import WriteTemperature from "./WriteTemperature";
import { getDisplayTemperature } from "../../../services/utils";
import PrideText from "../../../themes/PrideText";
import { useTranslation } from "react-i18next";

export default function WriteTemperatureContainer() {
  const { t } = useTranslation();
  const targetTemperature = useSelector(
    (state) => state.deviceInteraction.targetTemperature
  );

  const isF = useSelector((state) => state.settings.isF);
  const temperatureControlValues = useSelector(
    (state) => state.settings.config.temperatureControlValues
  );

  const pendingTemperature = useRef(null);
  const pendingIntent = useRef(null);
  const debounceRef = useRef(debounce((value, generation, intent) => {
    pendingTemperature.current = null;
    queueTemperature(value, generation, intent);
  }, temperatureIncrementedDecrementedDebounceTime));
  useEffect(() => () => debounceRef.current.cancel(), []);

  const onClickIncrement = (incrementValue) => () => {
    if (pendingIntent.current !== getTemperatureIntent()) pendingTemperature.current = null;
    const nextTemp = (pendingTemperature.current ?? targetTemperature) + incrementValue;
    if (!isValueInValidVolcanoCelciusRange(nextTemp)) return;
    pendingTemperature.current = nextTemp;
    pendingIntent.current = beginTemperatureIntent();
    debounceRef.current(nextTemp, getWorkflowGeneration(), pendingIntent.current);
  };

  const onClick = (value) => () => {
    debounceRef.current.cancel();
    pendingTemperature.current = null;
    queueTemperature(value);
  };

  const temperatureButtons = temperatureControlValues.map((item, index) => {
    return (
      <WriteTemperature
        key={index}
        onClick={onClick(item)}
        buttonText={<PrideText text={getDisplayTemperature(item, isF)} />}
        isActive={item === targetTemperature}
      />
    );
  });

  temperatureButtons.unshift(
    <PlusMinusButton
      key="incrementTemperatureButton"
      aria-label={t('accessibility.plusOneTemperature')}
      onClick={onClickIncrement(1)}
      buttonText={
        <svg
          aria-hidden="true"
          focusable="false"
          data-prefix="fas"
          data-icon="plus"
          className="svg-inline--fa fa-plus fa-w-14"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 448 512"
        >
          <path
            fill="currentColor"
            d="M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"
          ></path>
        </svg>
      }
    />
  );

  temperatureButtons.unshift(
    <PlusMinusButton
      key="decrementTemperatureButton"
      aria-label={t('accessibility.minusOneTemperature')}
      onClick={onClickIncrement(-1)}
      buttonText={
        <svg
          aria-hidden="true"
          focusable="false"
          data-prefix="fas"
          data-icon="minus"
          className="svg-inline--fa fa-minus fa-w-14"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 448 512"
        >
          <path
            fill="currentColor"
            d="M416 208H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h384c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"
          ></path>
        </svg>
      }
    />
  );
  if (temperatureButtons.length % 2 !== 0) {
    temperatureButtons.push(
      <WriteTemperature
        key={999999}
        onClick={() => {}}
        buttonText={<PrideText text="" />}
      />
    );
  }

  return <div className="temperature-write-div">{temperatureButtons}</div>;
}
