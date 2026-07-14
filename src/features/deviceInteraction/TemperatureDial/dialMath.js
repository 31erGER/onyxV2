export const DIAL_START_ANGLE = -135;
export const DIAL_SWEEP = 270;

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function tempToAngle(temp, minTemp, maxTemp) {
  const fraction =
    (clamp(temp, minTemp, maxTemp) - minTemp) / (maxTemp - minTemp);
  return DIAL_START_ANGLE + fraction * DIAL_SWEEP;
}

export function angleToTemp(angle, minTemp, maxTemp) {
  const clamped = clamp(angle, DIAL_START_ANGLE, DIAL_START_ANGLE + DIAL_SWEEP);
  const fraction = (clamped - DIAL_START_ANGLE) / DIAL_SWEEP;
  return Math.round(minTemp + fraction * (maxTemp - minTemp));
}

export function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

export function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

export function pointerToAngle(cx, cy, x, y) {
  const angle = (Math.atan2(x - cx, cy - y) * 180) / Math.PI;
  return clamp(angle, DIAL_START_ANGLE, DIAL_START_ANGLE + DIAL_SWEEP);
}
