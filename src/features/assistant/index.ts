import "./events/app_mention";
import "./events/add_to_assistant";
import "./events/sync_command";
import { features } from "../../features";

const assistantFeatureFlag = features.register({
  label: "Assistant",
  description: "Enables the ai assistant feature.",
  tags: [
    {
      name: "Silent",
      description: "Fails silently when prompted by an unauthorized user.",
    },
  ],
} as const);
