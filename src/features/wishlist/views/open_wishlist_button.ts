import { Button } from "slack-edge";
import { openWishlistAction } from "../events/open_wishlist";

export function getOpenWishlistButton(): Button {
  return {
    type: "button",
    text: {
      type: "plain_text",
      text: "🎁 Open Wishlist",
      emoji: true,
    },
    action_id: openWishlistAction,
  };
}
