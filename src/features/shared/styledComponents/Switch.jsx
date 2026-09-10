import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";

const Wrapper = styled.div`
  display: flex;
  flex-grow: 1;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  cursor: pointer;
  -webkit-user-select: none;
  user-select: none;
`;

const Track = styled.div`
  position: relative;
  width: 3.6rem;
  height: 2rem;
  flex-shrink: 0;
  border-radius: ${(p) => p.theme.neumorphic.radiusPill};
  background: ${(p) => p.theme.neumorphic.surface};
  box-shadow: ${(p) => p.theme.neumorphic.pressed};
`;

const Knob = styled.div`
  position: absolute;
  top: 0.2rem;
  left: ${(p) => (p.$on ? "1.8rem" : "0.2rem")};
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 50%;
  background: ${(p) =>
    p.$on
      ? p.theme.neumorphic.accent.gradient
      : p.theme.neumorphic.textSecondary};
  box-shadow: ${(p) => p.theme.neumorphic.raisedSmall};
  transition: left 0.25s ease, background 0.25s ease;
`;

const Caption = styled.span`
  font-size: 1.05rem;
  font-weight: 600;
  color: ${(p) =>
    p.$on ? p.theme.neumorphic.text : p.theme.neumorphic.textSecondary};
`;

const ToggleSwitch = React.forwardRef(function ToggleSwitch(
  { controlled = false, isToggleOn = false, onChange = () => {}, onText = "On", offText = "Off" },
  ref
) {
  const [isOn, setIsOn] = useState(isToggleOn);

  useEffect(() => {
    setIsOn(isToggleOn);
  }, [isToggleOn]);

  const shownOn = controlled ? isToggleOn : isOn;
  const handleClick = () => {
    const nextState = !shownOn;
    if (!controlled) setIsOn(nextState);
    onChange(nextState);
  };

  return (
    <Wrapper
      ref={ref}
      onClick={handleClick}
      role="switch"
      aria-checked={shownOn}
    >
      <Track>
        <Knob $on={shownOn} />
      </Track>
      <Caption $on={shownOn}>{shownOn ? onText : offText}</Caption>
    </Wrapper>
  );
});

ToggleSwitch.propTypes = {
  controlled: PropTypes.bool,
  isToggleOn: PropTypes.bool,
  onChange: PropTypes.func,
  onText: PropTypes.node,
  offText: PropTypes.node,
};

export default ToggleSwitch;
