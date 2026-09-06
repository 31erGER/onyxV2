import HeatOn from "./HeatOn/HeatOnContainer";
import FanOn from "./FanOn/FanOnContainer";
import WriteTemperature from "./WriteTemperature/WriteTemperatureContainer";
import TemperatureDialContainer from "./TemperatureDial/TemperatureDialContainer";
import WorkFlow from "../workflowEditor/WorkflowButtons";
import Container from "react-bootstrap/Container";
import styled from "styled-components";
import { isDeviceConnected } from "../../services/BleCharacteristicCache";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PrideText from "../../themes/PrideText";

const Div = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 1.25rem;
  padding: 1rem 0 2rem;
`;

const ToggleRow = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
`;

const NotConnectedWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  gap: 1.5rem;
  padding: 3rem 1rem;
  text-align: center;
`;

const ConnectLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 1.5rem;
  border-radius: ${(p) => p.theme.neumorphic?.radiusPill || "2rem"};
  background: ${(p) => p.theme.neumorphic?.accent?.gradient || p.theme.buttonColorMain};
  color: ${(p) => p.theme.neumorphic?.accent?.onAccent || "#fff"};
  box-shadow: ${(p) => p.theme.neumorphic?.raised || "none"};
  text-decoration: none;
  font-weight: 600;
  font-size: 1.05rem;

  &:active {
    transform: scale(0.97);
  }
`;

const SubText = styled.p`
  margin: 0;
  font-size: 1rem;
  color: ${(p) => p.theme.neumorphic?.textSecondary || p.theme.primaryFontColor};
  max-width: 24rem;
  line-height: 1.5;
`;

function Volcano() {
  const { t } = useTranslation();

  if (!isDeviceConnected()) {
    return (
      <Container style={{ display: "flex" }}>
        <NotConnectedWrapper>
          <h2>
            <PrideText text={t("controls.notConnectedTitle")} />
          </h2>
          <SubText>{t("controls.notConnectedDescription")}</SubText>
          <ConnectLink to="/device">
            {t("controls.connectButton")}
          </ConnectLink>
        </NotConnectedWrapper>
      </Container>
    );
  }

  return (
    <Container style={{ display: "flex" }}>
      <Div>
        <ToggleRow className="heat-air-div">
          <HeatOn />
          <FanOn />
        </ToggleRow>
        <TemperatureDialContainer />
        <WriteTemperature />
        <WorkFlow />
      </Div>
    </Container>
  );
}

export default Volcano;
