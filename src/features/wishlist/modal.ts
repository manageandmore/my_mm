import { AnyModalBlock, ModalView } from "slack-edge";
import { WishlistItem } from "./query";

export interface WishlistOptions {
  items?: WishlistItem[]
}

export function getWishlistModal(options: WishlistOptions): ModalView {
  let blocks: AnyModalBlock[]

  if (options.items == null) {
    blocks = [
      {
        "type": "section",
        "text": {
          "type": "plain_text",
          "text": "Loading...",
          "emoji": true
        }
      }
    ]
  } else {
    blocks = []
    for (let item of options.items) {
      blocks.push({
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `*${item.title}*`
        }
      }
      )
      blocks.push({
        "type": "actions",
        "elements": [
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "text": `Upvote (${item.votes})`,
              "emoji": true
            },
            "action_id": "upvote_wishlist_item",
            "value": item.id
          }
        ]
      })
      blocks.push({
        "type": "divider"
      })
    }
  }

  return {
    "type": "modal",
    "title": {
      "type": "plain_text",
      "text": "Wishlist",
      "emoji": true
    },
    "blocks": blocks
  }
}