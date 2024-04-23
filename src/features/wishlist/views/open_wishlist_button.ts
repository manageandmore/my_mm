import { AnyHomeTabBlock, Button } from "slack-edge";
import { openWishlistAction } from "../events/open_wishlist";

export function getWishlistSection(): AnyHomeTabBlock[] {
  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "Wishlist",
      }
    },
    {
      type: "context",
      elements: [{
        type: "mrkdwn",
        text: "Vote on suggestions for *My MM* made by the community, or add your own suggestion. This helps us to prioritize new features and improve *My MM*."
      }]
    },
    {
      type: "actions",
      elements: [
        getOpenWishlistButton(),
      ],
    },
  ]
}

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
