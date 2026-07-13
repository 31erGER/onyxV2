import styled from "styled-components";

const NeuCard = styled.div`
  background: ${(p) => p.theme.neumorphic.surface};
  border-radius: ${(p) => p.theme.neumorphic.radiusCard};
  box-shadow: ${(p) =>
    p.$inset
      ? p.theme.neumorphic.pressed
      : p.$flat
      ? p.theme.neumorphic.flat
      : p.theme.neumorphic.raised};
  padding: 1rem;
`;

export default NeuCard;
