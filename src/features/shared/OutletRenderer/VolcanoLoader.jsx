import { Outlet, Link } from "react-router-dom";
import { useEffect, useCallback } from "react";
import {
  getCharacteristic,
  isDeviceConnected,
} from "../../../services/BleCharacteristicCache";
import * as uuIds from "../../../constants/uuids";
import "./Volcano.css";
import BottomNav from "../BottomNav/BottomNav";
import styled from "styled-components";
import { heatingMask, fanMask, fahrenheitMask } from "../../../constants/masks";
import {
  convertBLEtoUint16,
  convertToggleCharacteristicToBool,
} from "../../../services/utils";
import { useDispatch } from "react-redux";
import store from "../../../store";
import {
  setIsHeatOn,
  setIsFanOn,
} from "../../deviceInteraction/deviceInteractionSlice";
import { setIsF } from "../../settings/settingsSlice";
import { AddToQueue } from "../../../services/bleQueueing";
import CurrentWorkflowExecutionDisplay from "../../deviceInteraction/CurrentWorkflowExecutionDisplay.jsx/CurrentWorkflowExecutionDisplay";
import withScrolling from "react-dnd-scrolling";
import AutoOff from "../../deviceInteraction/AutoOff/AutoOff";

const ScrollingDiv = withScrolling("div");

const MainWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const ContentWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  padding-bottom: 5.5rem;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem 0.25rem;
  flex-shrink: 0;
`;

const BrandLink = styled(Link)`
  font-weight: 700;
  font-size: 1.1rem;
  text-decoration: none;
  color: ${(p) => p.theme.neumorphic.text};
`;

export default function VolcanoLoader(props) {
  const dispatch = useDispatch();

  // Set up BLE event listeners only when connected
  useEffect(() => {
    if (!isDeviceConnected()) return;

    const handlePrj1ChangedVolcano = (event) => {
      let currentVal = convertBLEtoUint16(event.target.value);
      const newHeatValue = convertToggleCharacteristicToBool(
        currentVal,
        heatingMask
      );
      if (store.getState().deviceInteraction.isHeatOn !== newHeatValue) {
        dispatch(setIsHeatOn(newHeatValue));
      }

      currentVal = convertBLEtoUint16(event.target.value);
      const newFanValue = convertToggleCharacteristicToBool(
        currentVal,
        fanMask
      );
      if (store.getState().deviceInteraction.isFanOn !== newFanValue) {
        dispatch(setIsFanOn(newFanValue));
      }
    };

    let characteristicPrj1V;
    try {
      characteristicPrj1V = getCharacteristic(uuIds.register1Uuid);
    } catch {
      return;
    }

    const blePayload = async () => {
      await characteristicPrj1V.addEventListener(
        "characteristicvaluechanged",
        handlePrj1ChangedVolcano
      );
      await characteristicPrj1V.startNotifications();
    };
    AddToQueue(blePayload);

    return () => {
      const blePayload = async () => {
        await characteristicPrj1V?.removeEventListener(
          "characteristicvaluechanged",
          handlePrj1ChangedVolcano
        );
      };
      AddToQueue(blePayload);
    };
  }, [dispatch]);

  const readFOrCToStore = useCallback(() => {
    if (!isDeviceConnected()) return;

    let characteristicPrj2V;
    try {
      characteristicPrj2V = getCharacteristic(uuIds.register2Uuid);
    } catch {
      return;
    }

    const blePayload = async () => {
      const value = await characteristicPrj2V.readValue();
      const convertedValue = convertBLEtoUint16(value);
      const isFValue = convertToggleCharacteristicToBool(
        convertedValue,
        fahrenheitMask
      );
      if (store.getState().settings.isF !== isFValue) {
        dispatch(setIsF(isFValue));
      }
    };
    AddToQueue(blePayload);
  }, [dispatch]);

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible" && isDeviceConnected()) {
        setTimeout(() => {
          const blePayload = async () => {
            const characteristicPrj1V = getCharacteristic(uuIds.register1Uuid);
            const value = await characteristicPrj1V.readValue();
            const currentVal = convertBLEtoUint16(value);
            const newHeatValue = convertToggleCharacteristicToBool(
              currentVal,
              heatingMask
            );
            if (store.getState().deviceInteraction.isHeatOn !== newHeatValue) {
              dispatch(setIsHeatOn(newHeatValue));
            }
          };
          AddToQueue(blePayload);
        }, 250);

        setTimeout(() => {
          readFOrCToStore();
        }, 250);
      }
    };
    document.addEventListener("visibilitychange", handler);

    return () => {
      document.removeEventListener("visibilitychange", handler);
    };
  }, [dispatch, readFOrCToStore]);

  //bind event handlers for register2
  useEffect(() => {
    if (!isDeviceConnected()) return;

    function handlePrj2ChangedVolcano(event) {
      const currentVal = convertBLEtoUint16(event.target.value);
      const changedValue = convertToggleCharacteristicToBool(
        currentVal,
        fahrenheitMask
      );
      if (store.getState().settings.isF !== changedValue) {
        dispatch(setIsF(changedValue));
      }
    }

    let characteristicPrj2V;
    try {
      characteristicPrj2V = getCharacteristic(uuIds.register2Uuid);
    } catch {
      return;
    }

    const blePayload = async () => {
      await characteristicPrj2V.addEventListener(
        "characteristicvaluechanged",
        handlePrj2ChangedVolcano
      );
      await characteristicPrj2V.startNotifications();
    };

    AddToQueue(blePayload);
    return () => {
      const blePayload = async () => {
        await characteristicPrj2V?.removeEventListener(
          "characteristicvaluechanged",
          handlePrj2ChangedVolcano
        );
      };
      AddToQueue(blePayload);
    };
  }, [dispatch]);

  const outletStyling = {
    display: "flex",
    justifyContent: "space-between",
    flexGrow: "1",
  };

  return (
    <MainWrapper>
      <Header>
        <BrandLink to="/">Project Onyx</BrandLink>
        <AutoOff style={{ marginLeft: "10px" }} />
        <CurrentWorkflowExecutionDisplay />
      </Header>

      <ContentWrapper>
        <ScrollingDiv className="main-div">
          <div style={outletStyling}>
            <Outlet {...props} />
          </div>
        </ScrollingDiv>
      </ContentWrapper>

      <BottomNav />
    </MainWrapper>
  );
}
