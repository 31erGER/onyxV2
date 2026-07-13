import { DEFAULT_ACCENT } from "../themes/neumorphic/createNeumorphicTheme";

const LEGACY_LIGHT_THEMES = ["Light", "Flamingo", "Valentines Day"];
const LEGACY_AUTO_THEME = "Auto Seasonal Rotate";
const VALID_MODES = ["auto", "light", "dark"];

export function migrateLegacyConfig(config) {
  const result = { ...(config || {}) };

  if (!VALID_MODES.includes(result.appearanceMode)) {
    if (
      typeof result.currentTheme === "string" &&
      result.currentTheme !== LEGACY_AUTO_THEME
    ) {
      result.appearanceMode = LEGACY_LIGHT_THEMES.includes(result.currentTheme)
        ? "light"
        : "dark";
    } else {
      result.appearanceMode = "auto";
    }
  }

  if (!result.accentColors?.start || !result.accentColors?.end) {
    result.accentColors = { ...DEFAULT_ACCENT };
  }

  delete result.currentTheme;
  return result;
}
