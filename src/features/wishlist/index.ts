import "./events/open_wishlist";
import "./events/vote_suggestion";
import "./events/new_suggestion";
import { features } from "../../features";

const wishlistFeatureFlag = features.register({
  label: "Wishlist",
  description: "Enables the wishlist feature.",
  tags: [
    {
      name: "Hidden",
      description: "Completely hides the feature from unauthorized users.",
    },
    {
      name: "Readonly",
      description: "Gives unauthorized users readonly access to the wishlist.",
    },
  ],
} as const);
