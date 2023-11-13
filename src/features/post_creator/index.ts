import { features } from "../common/feature_flags";

import "./actions/shortcut";
import "./actions/create_post";
import "./actions/add_to_calendar";

export const postCreatorFeatureFlag = features.register({
  label: "Post Creator",
  description: "Enables the post creator feature.",
} as const);
