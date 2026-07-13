export function hexToRgb(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }) {
  const toHex = (v) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function mix(hexA, hexB, weight) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const w = Math.max(0, Math.min(1, weight));
  return rgbToHex({
    r: a.r * w + b.r * (1 - w),
    g: a.g * w + b.g * (1 - w),
    b: a.b * w + b.b * (1 - w),
  });
}

export function withAlpha(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const channel = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(hexA, hexB) {
  const la = relativeLuminance(hexA);
  const lb = relativeLuminance(hexB);
  const [light, dark] = la >= lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
}

export function readableTextOn(hex) {
  return contrastRatio(hex, "#1c1c20") >= contrastRatio(hex, "#ffffff")
    ? "#1c1c20"
    : "#ffffff";
}

// Nudges `hex` away from `surfaceHex` (5% steps toward black or white,
// whichever direction the surface is NOT) until minRatio is met.
export function ensureContrast(hex, surfaceHex, minRatio = 1.5) {
  if (contrastRatio(hex, surfaceHex) >= minRatio) {
    return hex;
  }
  const target =
    relativeLuminance(surfaceHex) >= 0.5 ? "#000000" : "#ffffff";
  let result = hex;
  for (let i = 0; i < 20; i++) {
    result = mix(target, result, 0.05);
    if (contrastRatio(result, surfaceHex) >= minRatio) {
      return result;
    }
  }
  return result;
}
