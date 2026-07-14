import styled from "styled-components";

export const InactiveButton = styled.button`
  font-size: 1.1rem;
  min-height: 2.75rem;
  flex-grow: 1;
  border: none;
  border-radius: ${(props) => props.theme.neumorphic.radiusPill};
  background: ${(props) => props.theme.neumorphic.surface};
  color: ${(props) => props.theme.neumorphic.text};
  box-shadow: ${(props) => props.theme.neumorphic.raisedSmall};
  transition: box-shadow 0.15s ease, transform 0.15s ease;
  touch-action: manipulation;

  &:active {
    box-shadow: ${(props) => props.theme.neumorphic.pressed};
    transform: translateY(1px);
  }
`;

export const GlowyInactiveButton = styled(InactiveButton)`
  box-shadow: ${(props) => props.theme.neumorphic.raisedSmall},
    0 0 10px ${(props) => props.theme.neumorphic.accent.start};
`;

export const ActiveButton = styled(InactiveButton)`
  background: ${(props) => props.theme.neumorphic.accent.gradient};
  color: ${(props) => props.theme.neumorphic.accent.onAccent};
`;

export const PlusMinusButton = styled(InactiveButton)``;

export const Div = styled.div`
  display: flex;
  width: 48%;
  flex-grow: 1;
  margin: 0px 2.5px 8px;

  /* Allow minimalist mode to override width */
  .minimalist-mode & {
    width: 100% !important;
    margin: 0 !important;
    flex: 1 !important;
  }

  svg {
    height: 2rem;
    width: 2rem;
  }
`;
