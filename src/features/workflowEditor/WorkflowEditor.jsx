import styled from "styled-components";
import Accordion from "react-bootstrap/Accordion";
import WorkflowItemEditor from "./WorkflowItemEditor";
import CreateWorkflowButton from "./CreateWorkflowButton";
import { useState } from "react";
import { useSelector } from "react-redux";
import DeleteWorkflowButton from "./DeleteWorkflowButton";
import CreateWorkflowItemButton from "./CreateWorkflowItemButton";
import WorkflowNameEditor from "./WorkflowNameEditor";
import Div from "../shared/styledComponents/RootNonAppOutletDiv";
import WorkflowConfigEdtior from "./WorkflowConfigEditor.jsx/WorkflowConfigEditor";
import AppendWorkflowConfigJson from "./WorkflowConfigEditor.jsx/AppendWorkflowConfigJson";
import Drag from "./DND/Drag";
import WorkflowDrop from "./DND/WorkflowDrop";
import WorkflowTips from "./WorkflowTips";
import PrideText from "../../themes/PrideText";
import Container from "react-bootstrap/Container";
import CreatePremadeWorkflowButtonContainer from "./CreatePremadeWorkflowButtonContainer";
import { useTranslation } from "react-i18next";

const StyledAccordionBody = styled(Accordion.Body)`
  background: ${(props) => props.theme.neumorphic.surface};
  box-shadow: ${(props) => props.theme.neumorphic.pressed};
  color: ${(props) => props.theme.neumorphic.text};
  padding: 20px;
  overflow: hidden;
`;

const WorkflowDiv = styled.div`
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const StyledAccordionHeader = styled(Accordion.Header)`
  .accordion-button {
    background: ${(props) => props.theme.neumorphic.surface};
    color: ${(props) => props.theme.neumorphic.text};
    border: none;
    border-radius: 0;
    padding: 16px 20px;
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    box-shadow: none;
    transition: background 0.3s ease, color 0.3s ease;

    &:focus {
      box-shadow: none;
    }
  }

  .accordion-button:not(.collapsed) {
    background: ${(props) => props.theme.workflowEditor.accordionExpandedColor};
    color: ${(props) => props.theme.neumorphic.text};
    box-shadow: none;
  }

  .accordion-button:not(.collapsed)::after {
    background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='${(
      props
    ) =>
      props.theme.neumorphic.text.replace(
        "#",
        "%23"
      )}'><path fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/></svg>");
    transform: rotate(-180deg);
    transition: transform 0.3s ease;
  }

  .accordion-button::after {
    background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='${(
      props
    ) =>
      props.theme.neumorphic.text.replace(
        "#",
        "%23"
      )}'><path fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/></svg>");
    transition: transform 0.3s ease;
  }
`;

const WorkflowButtonsDiv = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid ${(props) => props.theme.neumorphic.shadowDark};
`;

const ConfigEditorSection = styled.div`
  background: ${(props) => props.theme.neumorphic.surface};
  border: none;
  border-radius: ${(props) => props.theme.neumorphic.radiusCard};
  box-shadow: ${(props) => props.theme.neumorphic.pressed};
  padding: 24px;
  margin: 30px 0;
`;

const ConfigEditorHeader = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

const ConfigDescription = styled.p`
  color: ${(props) => props.theme.primaryFontColor};
  opacity: 0.8;
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 12px 0 0 0;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const ConfigButtonsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
`;

const ConfigCard = styled.div`
  background: ${(props) => props.theme.neumorphic.surface};
  border: none;
  border-radius: ${(props) => props.theme.neumorphic.radiusCard};
  box-shadow: ${(props) => props.theme.neumorphic.raised};
  padding: 20px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  &:hover {
    transform: translateY(-2px);
  }
`;

const ConfigCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

const ConfigCardIcon = styled.span`
  font-size: 1.5rem;
  opacity: 0.8;
`;

const ConfigCardTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${(props) => props.theme.primaryColor || props.theme.primaryFontColor};
`;

const ConfigCardDescription = styled.p`
  margin: 0 0 20px 0;
  font-size: 0.9rem;
  line-height: 1.4;
  color: ${(props) => props.theme.primaryFontColor};
  opacity: 0.8;
`;

const WorkflowCreationSection = styled.div`
  background: ${(props) => props.theme.neumorphic.surface};
  border: none;
  border-radius: ${(props) => props.theme.neumorphic.radiusCard};
  box-shadow: ${(props) => props.theme.neumorphic.pressed};
  padding: 24px;
  margin: 30px 0;
`;

const WorkflowCreationHeader = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

const WorkflowCreationDescription = styled.p`
  color: ${(props) => props.theme.primaryFontColor};
  opacity: 0.8;
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 12px 0 0 0;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const WorkflowCreationButtonsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
`;

const WorkflowCreationCard = styled.div`
  background: ${(props) => props.theme.neumorphic.surface};
  border: none;
  border-radius: ${(props) => props.theme.neumorphic.radiusCard};
  box-shadow: ${(props) => props.theme.neumorphic.raised};
  padding: 20px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  z-index: 1;

  &:hover {
    transform: translateY(-2px);
  }

  &:first-child {
    z-index: 2;
  }
`;

const WorkflowCreationCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

const WorkflowCreationCardIcon = styled.span`
  font-size: 1.5rem;
  opacity: 0.8;
`;

const WorkflowCreationCardTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${(props) => props.theme.primaryColor || props.theme.primaryFontColor};
`;

const WorkflowCreationCardDescription = styled.p`
  margin: 0 0 20px 0;
  font-size: 0.9rem;
  line-height: 1.4;
  color: ${(props) => props.theme.primaryFontColor};
  opacity: 0.8;
`;

const AccordionItemWrapper = styled(Accordion.Item)`
  border: none;
  border-radius: ${(props) => props.theme.neumorphic.radiusCard};
  margin-bottom: 1rem;
  background: ${(props) => props.theme.neumorphic.surface};
  color: ${(props) => props.theme.neumorphic.text};
  box-shadow: ${(props) => props.theme.neumorphic.raised};
  overflow: hidden;

  &:last-child {
    margin-bottom: 0;
  }
`;

const WorkflowHeaderContainer = styled.div`
  text-align: center;
  margin-bottom: 28px;
  padding: 20px;
  background: ${(props) => props.theme.neumorphic.surface};
  border: none;
  border-radius: ${(props) => props.theme.neumorphic.radiusCard};
  box-shadow: ${(props) => props.theme.neumorphic.pressed};

  h1 {
    margin-bottom: 16px;
    font-size: 2.5rem;
    font-weight: 700;

    @media (max-width: 768px) {
      font-size: 2rem;
    }
  }
`;

const WorkflowDescription = styled.p`
  color: ${(props) => props.theme.primaryFontColor};
  opacity: 0.8;
  font-size: 1.1rem;
  line-height: 1.6;
  margin: 0;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

export default function WorkflowEditor() {
  const { t } = useTranslation();
  const [currentAccordionId, setCurrentAccordionId] = useState("0");

  const workflows = useSelector(
    (state) => state.settings.config.workflows.items
  );
  const currentWorkflow = useSelector(
    (state) => state.workflow.currentWorkflow
  );
  const currentWorkflowStepId = useSelector(
    (state) => state.workflow.currentWorkflowStepId
  );
  let currentWorkflowProgress = parseInt(
    (currentWorkflowStepId / currentWorkflow?.payload.length) * 100
  );

  if (isNaN(currentWorkflowProgress)) {
    currentWorkflowProgress = 0;
  }

  const workflowTestData = [...workflows];
  const onClick = (e) => {
    if (e === currentAccordionId) {
      setCurrentAccordionId(0);
    } else {
      setCurrentAccordionId(e);
    }
  };
  const onCreateWorkflow = (id) => {
    setCurrentAccordionId(`${id}`);
  };

  const workflowAccordions = workflowTestData.map((item, index) => {
    return (
      <div key={item.id}>
        <AccordionItemWrapper eventKey={`${item.id}`}>
          <StyledAccordionHeader onClick={() => onClick(`${item.id}`)}>
            <Drag
              onDrag={() => currentAccordionId > 0 && setCurrentAccordionId(0)}
              isSelected={item.id.toString() === currentAccordionId}
              key={item.id + index + item.name}
              itemId={item.id}
              itemName={item.name}
            >
              {<PrideText text={item.name} />}
            </Drag>
          </StyledAccordionHeader>
          <StyledAccordionBody>
            <WorkflowDiv>
              <WorkflowNameEditor workflowId={item.id} name={item.name} />
            </WorkflowDiv>
            {item.payload.map((workflowItem, index) => {
              return (
                <WorkflowDiv key={index}>
                  <WorkflowItemEditor
                    key={`${workflowItem.id}${index}`}
                    item={workflowItem}
                    workflowId={item.id}
                    itemIndex={index}
                    addDropZoneToTop={index === 0}
                  />
                </WorkflowDiv>
              );
            })}
            <WorkflowButtonsDiv>
              <CreateWorkflowItemButton id={item.id} />
              <DeleteWorkflowButton id={item.id} name={item.name} />
            </WorkflowButtonsDiv>
          </StyledAccordionBody>
        </AccordionItemWrapper>
        <WorkflowDrop key={item.id} itemId={item.id} />
      </div>
    );
  });

  return (
    <Div>
      <WorkflowHeaderContainer>
        <h1>
          <PrideText text={t("workflowEditor.title")} />
        </h1>
        <WorkflowDescription>
          {t("workflowEditor.description")}
        </WorkflowDescription>
      </WorkflowHeaderContainer>

      <div style={{ display: "flex", marginBottom: "24px" }}>
        <WorkflowDrop itemId={0} />
      </div>
      <Accordion activeKey={currentAccordionId}>{workflowAccordions}</Accordion>
      <WorkflowCreationSection>
        <WorkflowCreationHeader>
          <h2>
            <PrideText text={t("workflowEditor.createNewTitle")} />
          </h2>
          <WorkflowCreationDescription>
            {t("workflowEditor.createNewDescription")}
          </WorkflowCreationDescription>
        </WorkflowCreationHeader>
        <WorkflowCreationButtonsContainer>
          <WorkflowCreationCard>
            <WorkflowCreationCardHeader>
              <WorkflowCreationCardIcon>🎨</WorkflowCreationCardIcon>
              <WorkflowCreationCardTitle>
                {t("workflowEditor.customWorkflowTitle")}
              </WorkflowCreationCardTitle>
            </WorkflowCreationCardHeader>
            <WorkflowCreationCardDescription>
              {t("workflowEditor.customWorkflowDescription")}
            </WorkflowCreationCardDescription>
            <CreateWorkflowButton onClick={onCreateWorkflow} />
          </WorkflowCreationCard>
          <WorkflowCreationCard>
            <WorkflowCreationCardHeader>
              <WorkflowCreationCardIcon>📋</WorkflowCreationCardIcon>
              <WorkflowCreationCardTitle>
                {t("workflowEditor.templatesTitle")}
              </WorkflowCreationCardTitle>
            </WorkflowCreationCardHeader>
            <WorkflowCreationCardDescription>
              {t("workflowEditor.templatesDescription")}
            </WorkflowCreationCardDescription>
            <CreatePremadeWorkflowButtonContainer />
          </WorkflowCreationCard>
        </WorkflowCreationButtonsContainer>
      </WorkflowCreationSection>
      <Container></Container>
      <div style={{ marginTop: "20px" }}>
        <WorkflowTips />
      </div>
      <ConfigEditorSection>
        <ConfigEditorHeader>
          <h2>
            <PrideText text={t("workflowEditor.configEditorTitle")} />
          </h2>
          <ConfigDescription>
            {t("workflowEditor.configEditorDescription")}
          </ConfigDescription>
        </ConfigEditorHeader>
        <ConfigButtonsContainer>
          <ConfigCard>
            <ConfigCardHeader>
              <ConfigCardIcon>📤</ConfigCardIcon>
              <ConfigCardTitle>{t("workflowEditor.exportTitle")}</ConfigCardTitle>
            </ConfigCardHeader>
            <ConfigCardDescription>
              {t("workflowEditor.exportDescription")}
            </ConfigCardDescription>
            <WorkflowConfigEdtior />
          </ConfigCard>
          <ConfigCard>
            <ConfigCardHeader>
              <ConfigCardIcon>📥</ConfigCardIcon>
              <ConfigCardTitle>{t("workflowEditor.importTitle")}</ConfigCardTitle>
            </ConfigCardHeader>
            <ConfigCardDescription>
              {t("workflowEditor.importDescription")}
            </ConfigCardDescription>
            <AppendWorkflowConfigJson />
          </ConfigCard>
        </ConfigButtonsContainer>
      </ConfigEditorSection>
    </Div>
  );
}
