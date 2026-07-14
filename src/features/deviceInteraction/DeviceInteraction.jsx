import HeatOn from "./HeatOn/HeatOnContainer";
import FanOn from "./FanOn/FanOnContainer";
import WriteTemperature from "./WriteTemperature/WriteTemperatureContainer";
import TemperatureDialContainer from "./TemperatureDial/TemperatureDialContainer";
import WorkFlow from "../workflowEditor/WorkflowButtons";
import Container from "react-bootstrap/Container";
import styled from "styled-components";

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

function Volcano() {
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
