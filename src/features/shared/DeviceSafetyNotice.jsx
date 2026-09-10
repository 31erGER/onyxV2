import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { cancelCurrentWorkflow, resumeWorkflow } from "../../services/bleQueueing";
import NeuButton from "./neumorphic/NeuButton";

const Notice = styled.aside`
  position: fixed;
  z-index: 1200;
  bottom: 1rem;
  left: 1rem;
  right: 1rem;
  max-width: 32rem;
  max-height: 60vh;
  overflow: auto;
  margin: 0 auto;
  padding: 1rem;
  border-radius: 1rem;
  border: 2px solid ${(p) => p.theme.neumorphic.danger};
  background: ${(p) => p.theme.neumorphic.surface};
  color: ${(p) => p.theme.neumorphic.text};
  box-shadow: ${(p) => p.theme.neumorphic.raised};
  & a { color: inherit; text-decoration: underline; }
  & p { margin: 0 0 0.75rem; }
`;

export default function DeviceSafetyNotice() {
  const { t } = useTranslation();
  const error = useSelector((state) => state.deviceInteraction.controlError);
  const paused = useSelector((state) => state.workflow.isPaused);
  if (!error && !paused) return null;
  return (
    <Notice role={error ? "alert" : "status"}>
      <p>{t(error === "interrupted" ? "safety.interrupted" : error ? "safety.controlError" : "safety.paused")}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
        {!error && <NeuButton onClick={resumeWorkflow}>{t("safety.resume")}</NeuButton>}
        <NeuButton onClick={() => cancelCurrentWorkflow()}>{t("safety.stop")}</NeuButton>
        {error && <Link to="/device">{t("safety.connection")}</Link>}
      </div>
    </Notice>
  );
}
