import styled, { keyframes, css } from "styled-components";
import { useState } from "react";
import PropTypes from "prop-types";
import PrideText from "../../themes/PrideText";
import { useTranslation } from "react-i18next";
import NeuCard from "../shared/neumorphic/NeuCard";
import NeuIconButton from "../shared/neumorphic/NeuIconButton";

const ConnectWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  flex-grow: 1;
  width: 100%;
  min-height: 100vh;
  box-sizing: border-box;
  padding: 2rem 1rem;
`;

const AppTitle = styled.h1`
  margin: 0;
  text-align: center;
  font-size: 1.6rem;
  font-weight: 700;
  color: ${(p) => p.theme.neumorphic.text};
`;

const connectPulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
`;

const ConnectButton = styled.button`
  width: 11rem;
  height: 11rem;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
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
  font-size: 3.25rem;
  line-height: 1;
`;

const ConnectDescription = styled.p`
  margin: 0;
  max-width: 30rem;
  text-align: center;
  font-size: 1.05rem;
  line-height: 1.6;
  color: ${(p) => p.theme.neumorphic.textSecondary};
`;

const ConnectInstruction = styled.div`
  text-align: center;
  font-size: 0.95rem;
  color: ${(p) => p.theme.neumorphic.textSecondary};
`;

const TipCard = styled(NeuCard)`
  width: 100%;
  max-width: 32rem;
  box-sizing: border-box;
`;

const TipHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`;

const TipLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const TipIcon = styled.span`
  font-size: 1.4rem;
`;

const TipTitle = styled.h3`
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: ${(p) => p.theme.neumorphic.text};
`;

const TipNav = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TipCounter = styled.span`
  min-width: 2.5rem;
  text-align: center;
  font-size: 0.8rem;
  color: ${(p) => p.theme.neumorphic.textSecondary};
`;

const TipContent = styled(NeuCard)`
  min-height: 6rem;
  display: flex;
  align-items: center;
  font-size: 1rem;
  line-height: 1.5;
  color: ${(p) => p.theme.neumorphic.text};
`;

export default function Ble(props) {
  const { t } = useTranslation();

  const tips = [
    t("tips.spacebar"),
    t("tips.brightness"),
    t("tips.clean"),
    t("tips.filter"),
    t("tips.themes"),
    t("tips.workflows"),
    t("tips.temperatures"),
    t("tips.bagReplace"),
    t("tips.bagTime"),
    t("tips.preheat"),
    t("tips.dragDrop"),
    t("tips.highlight"),
    t("tips.autoSeasonal"),
    t("tips.newCommands"),
    t("tips.miniMode"),
    t("tips.miniModeGrid"),
    t("tips.tempToggle"),
    t("tips.translation"),
  ];

  const [currentTipIndex, setCurrentTipIndex] = useState(
    Math.floor(Math.random() * tips.length)
  );

  const [connecting, setConnecting] = useState(false);

  const nextTip = () => {
    setCurrentTipIndex((prev) => (prev + 1) % tips.length);
  };

  const prevTip = () => {
    setCurrentTipIndex((prev) => (prev - 1 + tips.length) % tips.length);
  };

  const handleConnect = async () => {
    if (connecting) {
      return;
    }
    setConnecting(true);
    try {
      await props.onClick();
    } finally {
      setConnecting(false);
    }
  };

  return (
    <ConnectWrapper>
      <AppTitle>
        <PrideText text={t("connectTitle")} />
      </AppTitle>

      <ConnectButton
        type="button"
        onClick={handleConnect}
        $connecting={connecting}
      >
        <ConnectIcon>🔗</ConnectIcon>
      </ConnectButton>

      <ConnectDescription>{t("connectDescription")}</ConnectDescription>
      <ConnectInstruction>{t("connectInstruction")}</ConnectInstruction>

      <TipCard>
        <TipHeader>
          <TipLeft>
            <TipIcon>💡</TipIcon>
            <TipTitle>
              <PrideText text={t("proTipLabel")} />
            </TipTitle>
          </TipLeft>
          <TipNav>
            <NeuIconButton
              type="button"
              $size="2.75rem"
              onClick={prevTip}
              title={t("proTipPrevious")}
            >
              ←
            </NeuIconButton>
            <TipCounter>
              {currentTipIndex + 1}/{tips.length}
            </TipCounter>
            <NeuIconButton
              type="button"
              $size="2.75rem"
              onClick={nextTip}
              title={t("proTipNext")}
            >
              →
            </NeuIconButton>
          </TipNav>
        </TipHeader>
        <TipContent $inset>
          <PrideText text={tips[currentTipIndex]} />
        </TipContent>
      </TipCard>
    </ConnectWrapper>
  );
}

Ble.propTypes = {
  onClick: PropTypes.func.isRequired,
};
