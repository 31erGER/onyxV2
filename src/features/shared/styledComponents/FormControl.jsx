import Control from "react-bootstrap/FormControl";
import styled from "styled-components";

const ControlWrapper = styled(Control)`
  background: ${(props) => props.theme.neumorphic.surface};
  color: ${(props) => props.theme.neumorphic.text};
  border: none;
  box-shadow: ${(props) => props.theme.neumorphic.pressed};
  border-radius: 12px;

  &:focus {
    background: ${(props) => props.theme.neumorphic.surface};
    color: ${(props) => props.theme.neumorphic.text};
    border: none;
    box-shadow: ${(props) => props.theme.neumorphic.pressed},
      0 0 0 2px ${(props) => props.theme.neumorphic.accent.tint};
  }

  &:disabled {
    background: ${(props) => props.theme.neumorphic.surface};
    color: ${(props) => props.theme.neumorphic.textSecondary};
    box-shadow: ${(props) => props.theme.neumorphic.pressed};
  }

  &::placeholder {
    color: ${(props) => props.theme.neumorphic.textSecondary};
  }
`;

export default ControlWrapper;
