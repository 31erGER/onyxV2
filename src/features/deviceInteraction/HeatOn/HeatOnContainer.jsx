import HeatOn from "./HeatOn";
import { useSelector } from "react-redux";
import { queueHeat } from "../../../services/deviceCommands";

export default function HeatOnContainer() {
  const isHeatOn = useSelector((state) => state.deviceInteraction.isHeatOn);
  return <HeatOn onChange={queueHeat} isHeatOn={isHeatOn} />;
}
