import { features } from "../../features";
import "./action";

const postCreatorFeatureFlag = features.register({
  label: "PostCreator",
  description: "Enables the social post creator feature.",
  tags: [
    {
      name: "Silent",
      description: "Fails silently when invoked by an unauthorized user.",
    },
  ],
} as const);
