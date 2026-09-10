import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import styled, { keyframes, css } from "styled-components";
import { useTranslation } from "react-i18next";
import Ble from "../../services/bluetooth";
import {
  clearCache,
  isDeviceConnected,
  getCharacteristic,
} from "../../services/BleCharacteristicCache";
import { clearQueuesAndTimers } from "../../services/bleQueueing";

import { bleDeviceUuid } from "../../constants/uuids";
import PrideText from "../../themes/PrideText";
import Div from "../shared/styledComponents/RootNonAppOutletDiv";
import SettingsSection from "../settings/SettingsSection";
import DeviceInformation from "../deviceInformation/DeviceInformation";
import AdjustAutoShutoffTimeContainer from "../settings/AdjustAutoShutoffTime/AdjustAutoShutoffTimeContainer";
import AdjustLEDbrightnessContainer from "../settings/AdjustLEDbrightness/AdjustLEDbrightnessContainer";
import VibrationToggleContainer from "../settings/VibrationToggle/VibrationToggleContainer";
import DisplayOnCoolingToggleContainer from "../settings/DisplayOnCoolingToggle/DisplayOnCoolingToggleContainer";
import FOrC from "../settings/FOrC/FOrCContainer";
import FOrCLoader from "../settings/FOrC/FOrCLoader";

const connectPulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
`;

const ConnectSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  padding: 2rem 1rem;
`;

const ConnectButton = styled.button`
  width: 9rem;
  height: 9rem;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  font-size: 1.15rem;
  font-weight: 700;
  background: ${(p) => p.theme.neumorphic.accent.gradient};
  color: ${(p) => p.theme.neumorphic.accent.onAccent};
  box-shadow: ${(p) => p.theme.neumorphic.raised};
  transition: transform 0.15s ease;

  &:active {
    transform: scale(0.97);
    box-shadow: ${(p) => p.theme.neumorphic.pressed};
  }

  ${(p) =>
    p.$connecting &&
    css`
      animation: ${connectPulse} 1.8s ease-in-out infinite;
    `}
`;

const ConnectIcon = styled.span`
  font-size: 2.75rem;
  line-height: 1;
`;

const ConnectDescription = styled.p`
  margin: 0;
  max-width: 28rem;
  text-align: center;
  font-size: 1rem;
  line-height: 1.5;
  color: ${(p) => p.theme.neumorphic.textSecondary};
`;

const DisconnectButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  max-width: 20rem;
  padding: 0.85rem 1.25rem;
  border-radius: ${(p) => p.theme.neumorphic.radiusPill};
  border: none;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  background: ${(p) => p.theme.neumorphic.surface};
  color: ${(p) => p.theme.neumorphic.danger};
  box-shadow: ${(p) => p.theme.neumorphic.raised};
  margin: 1.5rem auto;

  &:active {
    box-shadow: ${(p) => p.theme.neumorphic.pressed};
  }
`;

export default function DevicePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [connecting, setConnecting] = useState(false);
  const isOnclickInProgressRef = useRef(false);

  const connected = isDeviceConnected() && !connecting;

  const onDisconnected = useCallback(() => {
    clearCache();
    clearQueuesAndTimers();
    // Force re-render by navigating to same page
    navigate("/device", { replace: true });
  }, [navigate]);

  const handleConnect = async () => {
    if (isOnclickInProgressRef.current) return;
    setConnecting(true);
    try {
      isOnclickInProgressRef.current = true;
      const connected = await Ble(() => {}, onDisconnected);
      if (!connected) return;
      navigate("/device", { replace: true });
    } catch (error) {
      console.log(error);
    } finally {
      setConnecting(false);
      isOnclickInProgressRef.current = false;
    }
  };

  const handleDisconnect = async () => {
    try {
      const bleDevice = getCharacteristic(bleDeviceUuid);
      if (bleDevice?.gatt) {
        await bleDevice.gatt.disconnect();
      }
    } catch (error) {
      console.warn("Error disconnecting:", error);
    }
    clearCache();
    clearQueuesAndTimers();
    navigate("/device", { replace: true });
  };

  if (!connected) {
    return (
      <Div>
        <ConnectSection>
          <h1>
            <PrideText text={t("devicePage.title")} />
          </h1>
          <ConnectButton
            type="button"
            aria-label={t("devicePage.connect")}
            onClick={handleConnect}
            $connecting={connecting}
          >
            <ConnectIcon>🔗</ConnectIcon>
          </ConnectButton>
          <ConnectDescription>
            {t("devicePage.connectDescription")}
          </ConnectDescription>
          <ConnectDescription>
            {t("safety.backgroundLimit")}
          </ConnectDescription>
        </ConnectSection>
      </Div>
    );
  }

  return (
    <Div>
      <h1>
        <PrideText text={t("devicePage.title")} />
      </h1>

      <ConnectDescription>{t("safety.backgroundLimit")}</ConnectDescription>
      <SettingsSection
        title={t("devicePage.settingsTitle")}
        icon="🌋"
        description={t("devicePage.settingsDescription")}
        defaultExpanded={true}
      >
        <AdjustAutoShutoffTimeContainer />
        <AdjustLEDbrightnessContainer />
        <VibrationToggleContainer />
        <DisplayOnCoolingToggleContainer />
        <FOrCLoader useSpinnerToShowLoader>
          <FOrC />
        </FOrCLoader>
      </SettingsSection>

      <SettingsSection
        title={t("devicePage.infoTitle")}
        icon="📋"
        description={t("devicePage.infoDescription")}
        defaultExpanded={true}
      >
        <DeviceInformation />
      </SettingsSection>

      <DisconnectButton onClick={handleDisconnect}>
        {t("devicePage.disconnect")}
      </DisconnectButton>
    </Div>
  );
}
