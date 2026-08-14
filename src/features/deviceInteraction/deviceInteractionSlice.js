import { createSlice } from "@reduxjs/toolkit";
import { RE_INITIALIZE_STORE } from "../../constants/actions";

export const deviceInteractionSlice = createSlice({
  name: "deviceInteraction",
  initialState: {
    currentTemperature: undefined,
    targetTemperature: undefined,
    isFanOn: undefined,
    isHeatOn: undefined,
  },
  reducers: {
    // An unusable reading arrives as null. Keeping the last known good temperature is
    // the safe choice - storing null would let the heat watchdog read the device as
    // cold and keep heating.
    setCurrentTemperature: (state, action) => {
      if (action.payload === null || isNaN(action.payload)) {
        return;
      }
      state.currentTemperature = action.payload;
    },
    setTargetTemperature: (state, action) => {
      if (action.payload === null || isNaN(action.payload)) {
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
} = deviceInteractionSlice.actions;

export default deviceInteractionSlice.reducer;
