export const MAX_CELSIUS_TEMP = 230;
export const MIN_CELSIUS_TEMP = 40;

// The span the device can plausibly report as a measured temperature. It reaches well
// below the lowest settable target when cold, and can overshoot the highest one. Only
// readings outside this span are sensor errors; a merely high reading is real and must
// be believed, because reading it as "not hot yet" would keep the heater running.
export const MIN_READABLE_CELSIUS_TEMP = 0;
export const MAX_PLAUSIBLE_CELSIUS_TEMP = 1000;

export const DEGREE_SYMBOL = "\u00B0";
