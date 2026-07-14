import Button from "../../shared/styledComponents/Button";
import Modal from "react-bootstrap/Modal";
import styled from "styled-components";

const StyledModalBody = styled(Modal.Body)`
  background: ${(props) => props.theme.neumorphic.surface};
  color: ${(props) => props.theme.neumorphic.text};
  border: none;
`;

const StyledModalHeader = styled(Modal.Header)`
  background: ${(props) => props.theme.neumorphic.surface};
  color: ${(props) => props.theme.neumorphic.text};
  border: none;
`;

const StyledModalTitle = styled(Modal.Title)`
  background: ${(props) => props.theme.neumorphic.surface};
  color: ${(props) => props.theme.neumorphic.text};
  border: none;
`;

const StyledModalFooter = styled(Modal.Footer)`
  background: ${(props) => props.theme.neumorphic.surface};
  color: ${(props) => props.theme.neumorphic.text};
  border: none;
`;

const StyledModal = styled(Modal)`
  .modal-content {
    background: ${(props) => props.theme.neumorphic.surface};
    color: ${(props) => props.theme.neumorphic.text};
    border: none;
    border-radius: ${(props) => props.theme.neumorphic.radiusCard};
    box-shadow: ${(props) => props.theme.neumorphic.raised};
  }
`;

const StyledModalButtons = styled(Button)`
  color: ${(props) => props.theme.neumorphic.text};
`;

export default function ModalWrapper(props) {
  return (
    <StyledModal show={props.show} onHide={props.handleClose}>
      <StyledModalHeader closeButton>
        <StyledModalTitle>{props.headerText}</StyledModalTitle>
      </StyledModalHeader>
      <StyledModalBody>{props.children || props.bodyText}</StyledModalBody>
      <StyledModalFooter>
        <StyledModalButtons onClick={props.handleClose}>
          Close
        </StyledModalButtons>
        <StyledModalButtons onClick={props.handleConfirm}>
          {props.confirmButtonText}
        </StyledModalButtons>
      </StyledModalFooter>
    </StyledModal>
  );
}
