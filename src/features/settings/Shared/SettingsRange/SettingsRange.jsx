import { Range } from "react-range";
import { useTheme } from "styled-components";

export default function SettingsRange({
  step,
  min,
  max,
  values,
  onChange,
  onFinalChange,
}) {
  const theme = useTheme();
  return (
    <Range
      step={step}
      min={min}
      max={max}
      values={values}
      onChange={(values) => onChange(values)}
      onFinalChange={onFinalChange}
      renderTrack={({ props, children }) => {
        const { key, ...restProps } = props;
        return (
          <div
            key={key}
            {...restProps}
            style={{
              ...restProps.style,
              display: "flex",
              flexGrow: "1",
              marginTop: "20px",
              marginBottom: "25px",
              marginLeft: "25px",
              borderRadius: "999px",
              height: "8px",
              width: "200px",
              background: theme.neumorphic.accent.gradient,
              boxShadow: theme.neumorphic.pressed,
              border: "none",
            }}
          >
            {children}
          </div>
        );
      }}
      renderThumb={({ props }) => {
        const { key, ...restProps } = props;
        return (
          <div
            key={key}
            {...restProps}
            style={{
              ...restProps.style,
              height: "26px",
              width: "26px",
              borderRadius: "50%",
              background: theme.neumorphic.surface,
              boxShadow: theme.neumorphic.raisedSmall,
              border: `3px solid ${theme.neumorphic.accent.end}`,
              cursor: "pointer",
            }}
          />
        );
      }}
    />
  );
}
