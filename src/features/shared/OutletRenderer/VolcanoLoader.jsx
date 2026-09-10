import { Outlet, Link } from "react-router-dom";

import "./Volcano.css";
import BottomNav from "../BottomNav/BottomNav";
import styled from "styled-components";

import CurrentWorkflowExecutionDisplay from "../../deviceInteraction/CurrentWorkflowExecutionDisplay.jsx/CurrentWorkflowExecutionDisplay";
import withScrolling from "react-dnd-scrolling";
import AutoOff from "../../deviceInteraction/AutoOff/AutoOff";
import { useSelector } from "react-redux";

const ScrollingDiv = withScrolling("div");

const MainWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const ContentWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  padding-bottom: 5.5rem;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem 0.25rem;
  flex-shrink: 0;
`;

const BrandLink = styled(Link)`
  font-weight: 700;
  font-size: 1.1rem;
  text-decoration: none;
  color: ${(p) => p.theme.neumorphic.text};
`;

export default function VolcanoLoader(props) {
  const currentWorkflow = useSelector((state) => state.workflow.currentWorkflow);
  const outletStyling = {
    display: "flex",
    justifyContent: "space-between",
    flexGrow: "1",
  };

  return (
    <MainWrapper>
      <Header>
        <BrandLink to="/">Project Onyx</BrandLink>
        {currentWorkflow ? (
          <CurrentWorkflowExecutionDisplay />
        ) : (
          <AutoOff style={{ marginLeft: "10px" }} />
        )}
      </Header>

      <ContentWrapper>
        <ScrollingDiv className="main-div">
          <div style={outletStyling}>
            <Outlet {...props} />
          </div>
        </ScrollingDiv>
      </ContentWrapper>

      <BottomNav />
    </MainWrapper>
  );
}
