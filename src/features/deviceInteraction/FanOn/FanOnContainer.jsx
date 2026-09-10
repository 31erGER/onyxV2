import { queueFan } from "../../../services/deviceCommands";
import { useEffect } from "react";

import FanOn from "./FanOn";
import { useSelector } from "react-redux";

import { useCallback } from "react";
import { useRef } from "react";

export default function FanOnContainer() {
  const isFanOn = useSelector((state) => state.deviceInteraction.isFanOn);
  const onClick = useCallback((nextState) => queueFan(nextState), []);

  const fanOnRef = useRef(null);
  const spaceBarKeycode = 32;
  useEffect(() => {
    const handler = (e) => {
      if (e.keyCode === spaceBarKeycode) {
        fanOnRef.current.click();
      }
    };
    document.addEventListener("keyup", handler);

    return () => {
      document.removeEventListener("keyup", handler);
    };
  }, [onClick]);

  return <FanOn ref={fanOnRef} onChange={onClick} isFanOn={isFanOn} />;
}
