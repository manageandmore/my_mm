import { features } from "../common/feature_flags";

import "./actions/shortcut";
import "./actions/create_post";
import "./actions/add_to_calendar";

export const postCreatorFeatureFlag = features.register({
  label: "Post Creator",
  description: "Enables the post creator feature.",
  tags: [
    {
      name: "ResponsiblePerson",
      value: "string",
      description:
        "The email addresses of the responsible persons from IP Marketing selectable for a content post, separated by a semicolon.",
    },
  ],
} as const);
