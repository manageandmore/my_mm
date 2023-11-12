import { AnyHomeTabBlock } from "slack-edge";
import { openWishlistAction } from "../events/open_wishlist";

export function getWishlistActionSection(): AnyHomeTabBlock {
  return {
    type: "actions",
    elements: [
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "🎁 Open Wishlist",
          emoji: true,
        },
        action_id: openWishlistAction,
      },
    ],
  };
}
