import { useId, useRef, useState } from "react";
import styled, { keyframes, css, useTheme } from "styled-components";
import PropTypes from "prop-types";
import {
  MIN_CELSIUS_TEMP,
  MAX_CELSIUS_TEMP,
} from "../../../constants/temperature";
import { getDisplayTemperature } from "../../../services/utils";
import {
  DIAL_START_ANGLE,
  DIAL_SWEEP,
  tempToAngle,
  angleToTemp,
  polarToCartesian,
  describeArc,
  pointerToAngle,
} from "./dialMath";

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
`;

const DialWrapper = styled.div`
  position: relative;
  width: ${(p) => (p.$compact ? "min(60vw, 15rem)" : "min(80vw, 20rem)")};
  margin: 0 auto;
  border-radius: 50%;
  box-shadow: ${(p) => p.theme.neumorphic.raised};
  background: ${(p) => p.theme.neumorphic.surface};
  touch-action: none;
`;

const ProgressArc = styled.path`
  ${(p) =>
    p.$pulsing &&
    css`
      animation: ${pulse} 1.6s ease-in-out infinite;
    `}
`;

const CenterText = styled.text`
  fill: ${(p) => p.theme.neumorphic.text};
  font-size: 44px;
  font-weight: 700;
`;

const TargetText = styled.text`
  fill: ${(p) => p.theme.neumorphic.textSecondary};
  font-size: 18px;
  font-weight: 600;
`;

const SIZE = 260;
const CENTER = SIZE / 2;
const RADIUS = 110;
const STROKE = 16;

export default function TemperatureDial({
  currentTemperature,
  targetTemperature,
  isF,
  isHeatOn,
  onTargetCommit,
  onCenterClick,
  compact = false,
}) {
  const theme = useTheme();
  const gradientId = useId();
  const svgRef = useRef(null);
  const [dragTemp, setDragTemp] = useState(null);

  const displayTarget = dragTemp ?? targetTemperature ?? MIN_CELSIUS_TEMP;
  const targetAngle = tempToAngle(
    displayTarget,
    MIN_CELSIUS_TEMP,
    MAX_CELSIUS_TEMP
  );
  const handlePos = polarToCartesian(CENTER, CENTER, RADIUS, targetAngle);

  const eventToTemp = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const scale = SIZE / rect.width;
    const x = (e.clientX - rect.left) * scale;
    const y = (e.clientY - rect.top) * scale;
    const angle = pointerToAngle(CENTER, CENTER, x, y);
    return angleToTemp(angle, MIN_CELSIUS_TEMP, MAX_CELSIUS_TEMP);
  };

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragTemp(eventToTemp(e));
  };

  const onPointerMove = (e) => {
    if (dragTemp === null) return;
    setDragTemp(eventToTemp(e));
  };

  const onPointerUp = () => {
    if (dragTemp === null) return;
    onTargetCommit(dragTemp);
    setDragTemp(null);
  };

  const showCurrent =
    (!isNaN(parseInt(currentTemperature)) &&
      currentTemperature > MIN_CELSIUS_TEMP &&
      currentTemperature <= MAX_CELSIUS_TEMP) ||
    isHeatOn;

  return (
    <DialWrapper $compact={compact}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ display: "block", width: "100%", height: "auto", margin: 0 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={theme.neumorphic.accent.start} />
            <stop offset="100%" stopColor={theme.neumorphic.accent.end} />
          </linearGradient>
        </defs>

        {/* full track */}
        <path
          d={describeArc(
            CENTER,
            CENTER,
            RADIUS,
            DIAL_START_ANGLE,
            DIAL_START_ANGLE + DIAL_SWEEP
          )}
          fill="none"
          stroke={theme.neumorphic.shadowDark}
          strokeOpacity="0.45"
          strokeWidth={STROKE}
          strokeLinecap="round"
        />

        {/* progress to target */}
        <ProgressArc
          $pulsing={isHeatOn}
          d={describeArc(CENTER, CENTER, RADIUS, DIAL_START_ANGLE, targetAngle)}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={STROKE}
          strokeLinecap="round"
        />

        {/* drag handle */}
        <circle
          cx={handlePos.x}
          cy={handlePos.y}
          r="13"
          fill={theme.neumorphic.surface}
          stroke={theme.neumorphic.accent.end}
          strokeWidth="4"
        />

        {/* invisible fat hit ring for touch */}
        <path
          d={describeArc(
            CENTER,
            CENTER,
            RADIUS,
            DIAL_START_ANGLE,
            DIAL_START_ANGLE + DIAL_SWEEP
          )}
          fill="none"
          stroke="transparent"
          strokeWidth="44"
          style={{ cursor: "pointer" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />

        <CenterText
          x={CENTER}
          y={compact ? CENTER + 14 : CENTER + 4}
          textAnchor="middle"
          opacity={showCurrent ? 1 : 0.25}
          style={{ cursor: onCenterClick ? "pointer" : "default" }}
          onClick={onCenterClick}
        >
          {getDisplayTemperature(currentTemperature ?? 0, isF)}
        </CenterText>
        {!compact && (
          <TargetText x={CENTER} y={CENTER + 34} textAnchor="middle">
            {getDisplayTemperature(displayTarget, isF)}
          </TargetText>
        )}
      </svg>
    </DialWrapper>
  );
}

TemperatureDial.propTypes = {
  currentTemperature: PropTypes.number,
  targetTemperature: PropTypes.number,
  isF: PropTypes.bool,
  isHeatOn: PropTypes.bool,
  onTargetCommit: PropTypes.func.isRequired,
  onCenterClick: PropTypes.func,
  compact: PropTypes.bool,
};
