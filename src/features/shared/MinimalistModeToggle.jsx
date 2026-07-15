import { useDispatch, useSelector } from "react-redux";
import { setIsMinimalistMode } from "../settings/settingsSlice";
import styled from "styled-components";
import NeuButton from "./neumorphic/NeuButton";

const MinimalistButton = styled(NeuButton)`
  padding: 8px 16px;
  font-size: 14px;
  margin: 5px;
`;

export default function MinimalistModeToggle() {
  const dispatch = useDispatch();
  const isMinimalistMode = useSelector((state) => state.settings.isMinimalistMode);

  const handleToggle = () => {
    dispatch(setIsMinimalistMode(!isMinimalistMode));
  };

  return (
    <MinimalistButton onClick={handleToggle}>
      {isMinimalistMode ? "Exit Minimalist" : "Minimalist Mode"}
    </MinimalistButton>
  );
}
