import "./events/app_mention";
import "./events/add_to_assistant";
import "./events/sync_notion_index";
import { features } from "../common/feature_flags";

export const assistantFeatureFlag = features.register({
  label: "Assistant",
  description: "Enables the ai assistant feature.",
  tags: [
    {
      name: "DisabledHint",
      description: "Response with a message to unauthorized users.",
      value: "string",
    },
  ],
} as const);
