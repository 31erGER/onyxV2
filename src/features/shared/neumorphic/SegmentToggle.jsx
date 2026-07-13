import styled from "styled-components";
import PropTypes from "prop-types";

const Track = styled.div`
  display: flex;
  background: ${(p) => p.theme.neumorphic.surface};
  box-shadow: ${(p) => p.theme.neumorphic.pressed};
  border-radius: ${(p) => p.theme.neumorphic.radiusPill};
  padding: 0.3rem;
  gap: 0.25rem;
`;

const Segment = styled.button`
  flex: 1;
  border: none;
  border-radius: ${(p) => p.theme.neumorphic.radiusPill};
  padding: 0.45rem 0.9rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  touch-action: manipulation;
  background: ${(p) =>
    p.$active ? p.theme.neumorphic.accent.gradient : "transparent"};
  color: ${(p) =>
    p.$active
      ? p.theme.neumorphic.accent.onAccent
      : p.theme.neumorphic.textSecondary};
  box-shadow: ${(p) => (p.$active ? p.theme.neumorphic.raisedSmall : "none")};
  transition: background 0.2s ease, color 0.2s ease;
`;

export default function SegmentToggle({ options, value, onChange, ariaLabel }) {
  return (
    <Track role="radiogroup" aria-label={ariaLabel}>
      {options.map((option) => (
        <Segment
          key={option.value}
          role="radio"
          aria-checked={option.value === value}
          $active={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Segment>
      ))}
    </Track>
  );
}

SegmentToggle.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.node.isRequired,
    })
  ).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  ariaLabel: PropTypes.string,
};
