import TemperatureControlSettings from "./TemperatureControlValues/TemperatureControlSettingsContainer";
import Div from "../shared/styledComponents/RootNonAppOutletDiv";
import AppearanceSettings from "./Appearance/AppearanceSettings";
import PrideText from "../../themes/PrideText";
import TurnHeatOnWhenConnectionIsEstablished from "./TurnHeatOnWhenConnectionIsEstablished/TurnHeatOnWhenConnectionIsEstablished";
import HighlightLastRunWorkflow from "./HighlightLastRunWorkflow/HighlightLastRunWorkflow";
import PWAInstall, { usePWAInstallAvailable } from "./InstallPWA/PWAInstall";
import SettingsSection from "./SettingsSection";
import LanguageSelector from "./LanguageSelector/LanguageSelector";
import MinimalistModeToggle from "../shared/MinimalistModeToggle";
import { useTranslation } from "react-i18next";

export default function Settings() {
  const { t } = useTranslation();
  const isPWAAvailable = usePWAInstallAvailable();
  return (
    <Div>
      <h1>
        <PrideText text={t("settings.title")} />
      </h1>

      <SettingsSection
        title={t("settings.appearance.title")}
        icon="🎨"
        description={t("settings.appearance.description")}
        defaultExpanded={true}
      >
        <AppearanceSettings />
      </SettingsSection>

      <SettingsSection
        title={t("settings.behavior.title")}
        icon="⚙️"
        description={t("settings.behavior.description")}
      >
        <LanguageSelector />
        <TurnHeatOnWhenConnectionIsEstablished />
        <HighlightLastRunWorkflow />
        <TemperatureControlSettings />
        <MinimalistModeToggle />
      </SettingsSection>

      {isPWAAvailable && (
        <SettingsSection
          title={t("settings.system.title")}
          icon="📱"
          description={t("settings.system.description")}
        >
          <PWAInstall />
        </SettingsSection>
      )}
    </Div>
  );
}
