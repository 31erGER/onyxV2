import SettingsItem from "../SettingsItem";
import NeuButton from "../../shared/neumorphic/NeuButton";
import PrideText from "../../../themes/PrideText";
import { useTranslation } from "react-i18next";

export default function FOrC(props) {
  const { t } = useTranslation();
  const currentScale =
    props.temperatureScaleAbbreviation === "F" ? t('common.celsius') : t('common.fahrenheit');

  return (
    <SettingsItem
      title={t('settings.items.temperatureScale.title')}
      description={t('settings.items.temperatureScale.description', { current: currentScale })}
    >
      <NeuButton onClick={props.onClick}>
        <PrideText text={t('settings.items.temperatureScale.changeTo', { scale: props.temperatureScaleAbbreviation })} />
      </NeuButton>
    </SettingsItem>
  );
}
