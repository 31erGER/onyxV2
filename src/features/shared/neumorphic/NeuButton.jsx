import styled from "styled-components";

const NeuButton = styled.button`
  border: none;
  border-radius: ${(p) => p.theme.neumorphic.radiusPill};
  min-height: 2.75rem;
  padding: 0.5rem 1.5rem;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  touch-action: manipulation;
  background: ${(p) =>
    p.$primary
      ? p.theme.neumorphic.accent.gradient
      : p.$danger
      ? p.theme.neumorphic.danger
      : p.theme.neumorphic.surface};
  color: ${(p) =>
    p.$primary
      ? p.theme.neumorphic.accent.onAccent
      : p.$danger
      ? p.theme.neumorphic.onDanger
      : p.theme.neumorphic.text};
  box-shadow: ${(p) => p.theme.neumorphic.raised};
  transition: box-shadow 0.15s ease, transform 0.15s ease;

  &:active {
    box-shadow: ${(p) => p.theme.neumorphic.pressed};
    transform: translateY(1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

export default NeuButton;
