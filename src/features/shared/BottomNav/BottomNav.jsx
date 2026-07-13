import { NavLink } from "react-router-dom";
import styled from "styled-components";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import ControlsIcon from "../OutletRenderer/icons/ControlsIcon";
import WorkflowEditorIcon from "../OutletRenderer/icons/WorkflowEditorIcon";
import SettingsIcon from "../OutletRenderer/icons/SettingsIcon";
import ContactMeIcon from "../OutletRenderer/icons/ContactMeIcon";
import BluetoothDisconnectIcon from "../OutletRenderer/icons/BluetoothDisconnectIcon";

const Bar = styled.nav`
  position: fixed;
  bottom: calc(0.75rem + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.6rem;
  padding: 0.55rem 0.8rem;
  border-radius: ${(p) => p.theme.neumorphic.radiusPill};
  background: ${(p) => p.theme.neumorphic.surface};
  box-shadow: ${(p) => p.theme.neumorphic.raised};
  z-index: 1000;
`;

const itemStyles = `
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 50%;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  touch-action: manipulation;
`;

const Item = styled(NavLink)`
  ${itemStyles}
  background: ${(p) => p.theme.neumorphic.surface};
  color: ${(p) => p.theme.neumorphic.textSecondary};
  box-shadow: none;

  &.active {
    background: ${(p) => p.theme.neumorphic.accent.gradient};
    color: ${(p) => p.theme.neumorphic.accent.onAccent};
    box-shadow: ${(p) => p.theme.neumorphic.raisedSmall};
  }

  /* icon components wrap their svg in a color-setting div; let it
     inherit the item color so active/inactive tinting works */
  div {
    display: inline-flex;
    color: inherit;
  }

  svg {
    width: 1.4rem;
    height: 1.4rem;
  }
`;

const DisconnectButton = styled.button`
  ${itemStyles}
  background: ${(p) => p.theme.neumorphic.surface};
  color: ${(p) => p.theme.neumorphic.danger};
  box-shadow: none;

  &:active {
    box-shadow: ${(p) => p.theme.neumorphic.pressed};
  }

  div {
    display: inline-flex;
    color: inherit;
  }

  svg {
    width: 1.4rem;
    height: 1.4rem;
  }
`;

export default function BottomNav({ onDisconnect }) {
  const { t } = useTranslation();
  return (
    <Bar>
      <Item to="/Volcano/App" aria-label={t("navigation.controls")}>
        <ControlsIcon />
      </Item>
      <Item
        to="/Volcano/WorkflowEditor"
        aria-label={t("navigation.workflowEditor")}
      >
        <WorkflowEditorIcon />
      </Item>
      <Item to="/Volcano/Settings" aria-label={t("navigation.settings")}>
        <SettingsIcon />
      </Item>
      <Item to="/Volcano/ContactMe" aria-label={t("navigation.contactMe")}>
        <ContactMeIcon />
      </Item>
      <DisconnectButton
        onClick={onDisconnect}
        aria-label={t("navigation.disconnect")}
      >
        <BluetoothDisconnectIcon />
      </DisconnectButton>
    </Bar>
  );
}

BottomNav.propTypes = { onDisconnect: PropTypes.func.isRequired };
