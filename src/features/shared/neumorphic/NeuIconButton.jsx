import styled from "styled-components";
import NeuButton from "./NeuButton";

const NeuIconButton = styled(NeuButton)`
  width: ${(p) => p.$size || "3.25rem"};
  height: ${(p) => p.$size || "3.25rem"};
  min-height: unset;
  padding: 0;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${(p) =>
    p.$active
      ? p.theme.neumorphic.accent.gradient
      : p.theme.neumorphic.surface};
  color: ${(p) =>
    p.$active
      ? p.theme.neumorphic.accent.onAccent
      : p.theme.neumorphic.accent.start};

  svg {
    width: 1.4rem;
    height: 1.4rem;
  }
`;

export default NeuIconButton;
