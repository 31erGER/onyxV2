import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import SegmentToggle from "../../shared/neumorphic/SegmentToggle";
import NeuButton from "../../shared/neumorphic/NeuButton";
import { setAppearanceMode, setAccentColors } from "../settingsSlice";
import { ACCENT_PRESETS } from "../../../themes/neumorphic/presets";
import { DEFAULT_ACCENT } from "../../../themes/neumorphic/createNeumorphicTheme";

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Label = styled.div`
  font-weight: 600;
  color: ${(p) => p.theme.neumorphic.textSecondary};
  font-size: 0.9rem;
`;

const PreviewRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const PreviewRing = styled.div`
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: ${(p) => p.theme.neumorphic.accent.gradient};
  box-shadow: ${(p) => p.theme.neumorphic.raisedSmall};
`;

const ColorRow = styled.div`
  display: flex;
  gap: 1rem;
`;

const ColorField = styled.label`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.9rem;
  color: ${(p) => p.theme.neumorphic.textSecondary};

  input[type="color"] {
    width: 100%;
    height: 3rem;
    border: none;
    border-radius: 12px;
    background: ${(p) => p.theme.neumorphic.surface};
    box-shadow: ${(p) => p.theme.neumorphic.pressed};
    padding: 0.4rem;
    cursor: pointer;
  }
`;

const PresetRow = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const PresetDot = styled.button`
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background: linear-gradient(135deg, ${(p) => p.$start}, ${(p) => p.$end});
  box-shadow: ${(p) => p.theme.neumorphic.raisedSmall};

  &:active {
    box-shadow: ${(p) => p.theme.neumorphic.pressed};
  }
`;

export default function AppearanceSettings() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const mode = useSelector(
    (state) => state.settings.config?.appearanceMode || "auto"
  );
  const accent = useSelector(
    (state) => state.settings.config?.accentColors || DEFAULT_ACCENT
  );

  const onColorChange = (key) => (e) =>
    dispatch(setAccentColors({ ...accent, [key]: e.target.value }));

  return (
    <Section>
      <Label>{t("appearance.mode")}</Label>
      <SegmentToggle
        ariaLabel={t("appearance.mode")}
        value={mode}
        onChange={(value) => dispatch(setAppearanceMode(value))}
        options={[
          { value: "light", label: t("appearance.light") },
          { value: "dark", label: t("appearance.dark") },
          { value: "auto", label: t("appearance.auto") },
        ]}
      />

      <Label>{t("appearance.accentColors")}</Label>
      <PreviewRow>
        <PreviewRing aria-hidden="true" />
        <NeuButton $primary type="button">
          {t("appearance.preview")}
        </NeuButton>
      </PreviewRow>

      <ColorRow>
        <ColorField>
          {t("appearance.startColor")}
          <input
            type="color"
            value={accent.start}
            onChange={onColorChange("start")}
          />
        </ColorField>
        <ColorField>
          {t("appearance.endColor")}
          <input
            type="color"
            value={accent.end}
            onChange={onColorChange("end")}
          />
        </ColorField>
      </ColorRow>

      <Label>{t("appearance.presets")}</Label>
      <PresetRow>
        {ACCENT_PRESETS.map((preset) => (
          <PresetDot
            key={preset.id}
            $start={preset.start}
            $end={preset.end}
            aria-label={t(`appearance.presetNames.${preset.id}`)}
            onClick={() =>
              dispatch(
                setAccentColors({ start: preset.start, end: preset.end })
              )
            }
          />
        ))}
      </PresetRow>

      <NeuButton
        type="button"
        onClick={() => dispatch(setAccentColors({ ...DEFAULT_ACCENT }))}
      >
        {t("appearance.reset")}
      </NeuButton>
    </Section>
  );
}
