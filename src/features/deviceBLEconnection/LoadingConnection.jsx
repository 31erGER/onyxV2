import styled, { keyframes } from "styled-components";
import PrideText from "../../themes/PrideText";
import { useTranslation } from "react-i18next";
import NeuCard from "../shared/neumorphic/NeuCard";

const Container = styled.div`
  min-height: 100vh;
  width: 100%;
  background-color: ${(p) => p.theme.neumorphic.surface};
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2.5rem 1.25rem;
  box-sizing: border-box;
`;

const LoadingCard = styled(NeuCard)`
  width: 90%;
  max-width: 32rem;
  padding: 2.5rem;
  text-align: center;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 2rem;
    width: 95%;
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.15);
    opacity: 0.6;
  }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const LoadingIcon = styled.div`
  width: 5rem;
  height: 5rem;
  margin: 0 auto 2rem;
  border: 4px solid ${(p) => p.theme.neumorphic.shadowLight};
  border-top: 4px solid ${(p) => p.theme.neumorphic.accent.start};
  border-radius: 50%;
  box-shadow: ${(p) => p.theme.neumorphic.flat};
  animation: ${spin} 1s linear infinite;

  @media (max-width: 768px) {
    width: 3.75rem;
    height: 3.75rem;
    margin-bottom: 1.5rem;
  }
`;

const LoadingTitle = styled.h1`
  margin: 0 0 1rem 0;
  font-size: 2rem;
  font-weight: 700;
  color: ${(p) => p.theme.neumorphic.text};

  @media (max-width: 768px) {
    font-size: 1.6rem;
  }
`;

const LoadingDescription = styled.p`
  margin: 0 0 1.5rem 0;
  font-size: 1.05rem;
  line-height: 1.6;
  color: ${(p) => p.theme.neumorphic.textSecondary};
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1.25rem;
`;

const StatusDot = styled.div`
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background: ${(p) => p.theme.neumorphic.accent.gradient};
  animation: ${pulse} 1.5s ease-in-out infinite;
  animation-delay: ${(p) => p.$delay || "0s"};
`;

const ConnectionSteps = styled.div`
  text-align: left;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid ${(p) => p.theme.neumorphic.shadowLight};
`;

const StepItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  color: ${(p) => p.theme.neumorphic.textSecondary};

  &:last-child {
    margin-bottom: 0;
  }
`;

const StepIcon = styled.span`
  font-size: 1rem;
`;

export default function LoadingConnection() {
  const { t } = useTranslation();

  return (
    <Container>
      <LoadingCard>
        <LoadingIcon />

        <LoadingTitle>
          <PrideText text={t("connection.connecting")} />
        </LoadingTitle>

        <LoadingDescription>
          {t("connection.establishingConnection")}
        </LoadingDescription>

        <StatusIndicator>
          <StatusDot $delay="0s" />
          <StatusDot $delay="0.2s" />
          <StatusDot $delay="0.4s" />
        </StatusIndicator>

        <ConnectionSteps>
          <StepItem>
            <StepIcon>🔒</StepIcon>
            {t("connection.securingConnection")}
          </StepItem>
          <StepItem>
            <StepIcon>📡</StepIcon>
            {t("connection.scanningDevice")}
          </StepItem>
          <StepItem>
            <StepIcon>⚡</StepIcon>
            {t("connection.initializing")}
          </StepItem>
        </ConnectionSteps>
      </LoadingCard>
    </Container>
  );
}
