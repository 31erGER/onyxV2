import {
  ensureContrast,
  mix,
  readableTextOn,
  withAlpha,
} from "./colorUtils";

export const SURFACES = {
  light: {
    surface: "#e8e6e1",
    shadowDark: "#c8c4bc",
    shadowLight: "#ffffff",
    text: "#3f3f46",
    textSecondary: "#8a8781",
  },
  dark: {
    surface: "#26262b",
    shadowDark: "#18181c",
    shadowLight: "#33333a",
    text: "#e8e6e1",
    textSecondary: "#9b9ba3",
  },
};

export const DEFAULT_ACCENT = { start: "#f5a97f", end: "#ee7d95" };

export default function createNeumorphicTheme(mode, accentStart, accentEnd) {
  const resolvedMode = mode === "dark" ? "dark" : "light";
  const s = SURFACES[resolvedMode];

  const start = ensureContrast(accentStart || DEFAULT_ACCENT.start, s.surface);
  const end = ensureContrast(accentEnd || DEFAULT_ACCENT.end, s.surface);
  const gradient = `linear-gradient(135deg, ${start}, ${end})`;
  const gradientVertical = `linear-gradient(to top, ${end}, ${start})`;
  const onAccent = readableTextOn(mix(start, end, 0.5));
  const danger = resolvedMode === "dark" ? "#e06060" : "#d64545";

  const raised = `6px 6px 12px ${withAlpha(s.shadowDark, 0.85)}, -6px -6px 12px ${withAlpha(s.shadowLight, resolvedMode === "dark" ? 0.4 : 0.9)}`;
  const raisedSmall = `3px 3px 6px ${withAlpha(s.shadowDark, 0.85)}, -3px -3px 6px ${withAlpha(s.shadowLight, resolvedMode === "dark" ? 0.4 : 0.9)}`;
  const pressed = `inset 4px 4px 8px ${withAlpha(s.shadowDark, 0.85)}, inset -4px -4px 8px ${withAlpha(s.shadowLight, resolvedMode === "dark" ? 0.35 : 0.8)}`;
  const flat = `2px 2px 5px ${withAlpha(s.shadowDark, 0.5)}, -2px -2px 5px ${withAlpha(s.shadowLight, resolvedMode === "dark" ? 0.25 : 0.6)}`;

  return {
    author: "Project Onyx V2",
    themeId: `neumorphic-${resolvedMode}`,
    borderStyle: "solid",
    borderColor: "transparent",
    buttonColorMain: s.surface,
    currentTemperatureColor: s.text,
    targetTemperatureColor: s.textSecondary,
    buttonActive: {
      color: onAccent,
      backgroundColor: start,
      borderColor: "transparent",
    },
    backgroundColor: s.surface,
    primaryFontColor: s.text,
    iconColor: start,
    iconTextColor: s.text,
    plusMinusButtons: {
      backgroundColor: s.surface,
      color: s.text,
      borderColor: "transparent",
    },
    temperatureRange: {
      lowTemperatureColor: start,
      highTemperatureColor: end,
      background: `linear-gradient(90deg, ${start}, ${end})`,
      backgroundVertical: gradientVertical,
      rangeBoxColor: s.surface,
      rangeBoxBorderColor: "transparent",
      rangeBackground: undefined,
      rangeBoxBorderRadius: "50%",
      rangeBoxBorderWidth: "0px",
    },
    workflowEditor: {
      accordionExpandedColor: mix(s.shadowDark, s.surface, 0.35),
    },
    ToggleButtons: {
      sliderBackgroundColorOn: s.surface,
      sliderBackgroundColorOff: s.surface,
      sliderBorderColorOn: "transparent",
      sliderBorderColorOff: "transparent",
      onBackgroundColor: gradient,
      onBorderColor: "transparent",
      onColor: onAccent,
      offBackgroundColor: mix(s.shadowDark, s.surface, 0.4),
      offBorderColor: "transparent",
      offColor: s.textSecondary,
      backgroundImageOn: undefined,
      backgroundImageOff: undefined,
      backgroundBlendModeOn: "unset",
      backgroundBlendModeOff: "unset",
    },
    neumorphic: {
      mode: resolvedMode,
      surface: s.surface,
      text: s.text,
      textSecondary: s.textSecondary,
      shadowDark: s.shadowDark,
      shadowLight: s.shadowLight,
      raised,
      raisedSmall,
      pressed,
      flat,
      radiusCard: "20px",
      radiusPill: "999px",
      danger,
      onDanger: readableTextOn(danger),
      accent: {
        start,
        end,
        gradient,
        gradientVertical,
        tint: withAlpha(start, 0.18),
        onAccent,
      },
    },
  };
}
