import { createSlice } from "@reduxjs/toolkit";
import { RE_INITIALIZE_STORE } from "../../constants/actions";

export const deviceInteractionSlice = createSlice({
  name: "deviceInteraction",
  initialState: {
    currentTemperature: undefined,
    targetTemperature: undefined,
    isFanOn: undefined,
    isHeatOn: undefined,
    controlError: null,
  },
  reducers: {
    setControlError: (state, action) => {
      state.controlError = action.payload;
    },
    // Retain the last display value on invalid data. Connection-owned telemetry
    // separately faults the controls; this value must not drive automatic heating.
    setCurrentTemperature: (state, action) => {
      if (!Number.isFinite(action.payload)) {
        return;
      }
      state.currentTemperature = action.payload;
    },
    setTargetTemperature: (state, action) => {
      if (!Number.isFinite(action.payload)) {
        return;
      }
      state.targetTemperature = action.payload;
    },
    setIsFanOn: (state, action) => {
      state.isFanOn = action.payload;
    },
    setIsHeatOn: (state, action) => {
      state.isHeatOn = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(RE_INITIALIZE_STORE, () => {
      return {
        currentTemperature: undefined,
        targetTemperature: undefined,
        isFanOn: undefined,
        isHeatOn: undefined,
        controlError: null,
      };
    });
  },
});

// Action creators are generated for each case reducer function
export const {
  setCurrentTemperature,
  setTargetTemperature,
  setIsFanOn,
  setIsHeatOn,
  setControlError,
} = deviceInteractionSlice.actions;

export default deviceInteractionSlice.reducer;
