import { features } from "../common/feature_flags";
import "./event";

export const homeFeatureFlag = features.register({
  label: "Home",
  description: "Enables the home page feature.",
  tags: [
    {
      name: "Countdown",
      description: "Shows a countdown to unauthorized users.",
      value: "date",
    },
  ],
} as const);
