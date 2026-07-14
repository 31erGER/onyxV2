import styled from "styled-components";

const Div = styled.div`
  display: flex;
  flex-direction: column;
  border: none;
  border-radius: ${(props) => props.theme.neumorphic.radiusCard};
  padding: 20px;
  flex-grow: 1;
  background: ${(props) => props.theme.neumorphic.surface};
  box-shadow: ${(props) => props.theme.neumorphic.raised};
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${(props) => props.theme.neumorphic.accent.gradient};
    opacity: 0.6;
  }

  &:hover {
    transform: translateY(-2px);

    &::before {
      opacity: 1;
    }
  }

  &:focus-within {
    box-shadow: ${(props) => props.theme.neumorphic.raised},
      0 0 0 2px ${(props) => props.theme.neumorphic.accent.tint};
  }
`;

export default Div;
