import { AnyModalBlock, Button, ImageElement, ModalView } from "slack-edge";
import { WishlistItem } from "../query";

export interface WishlistOptions {
  items?: WishlistItem[]
}

export function getWishlistModal(options: WishlistOptions): ModalView {
  let blocks: AnyModalBlock[]

  if (options.items == null) {
    blocks = [
      {
        type: "context",
        elements: [
          {
            type: "plain_text",
            emoji: true,
            text: "⏳ Loading all your awesome suggestions..."
          }
        ]
      },
    ]
  } else {
    blocks = [
      {
        "type": "context",
        "elements": [
          {
            "type": "mrkdwn",
            "text": "Vote on suggestions for *My MM* made by the community, or add your own suggestion. This helps us to prioritize new features and improve *My MM*."
          }
        ]
      },
      {
        "type": "divider"
      },
    ]
    for (let item of options.items) {
      blocks = blocks.concat(getWishlistItem(item))
    }
    blocks = blocks.concat([
      {
        "type": "actions",
        "elements": [
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "text": "Add Suggestion",
              "emoji": true
            },
            "style": "primary",
            "action_id": "new_wishlist_item",
          }
        ]
      }
    ])
  }

  return {
    "type": "modal",
    "title": {
      "type": "plain_text",
      "text": "🎁 Wishlist",
      "emoji": true
    },
    "blocks": blocks,
    "private_metadata": JSON.stringify(options.items ?? [])
  }
}

export function getWishlistItem(item: WishlistItem): AnyModalBlock[] {
  return [
    {
      "type": "section",
      "block_id": item.id,
      "text": {
        "type": "mrkdwn",
        "text": `*${item.title}*\n${item.description}`
      },
      "accessory": getVoteButton(item.votedByUser)
    },
    {
			"type": "context",
			"elements": [
        ...item.voters.map((voter) => ({
          "type": "image",
					"image_url": voter.imageUrl,
					"alt_text": voter.name
        } as ImageElement)),
				{
					"type": "plain_text",
					"emoji": true,
					"text": `${item.voters.length} vote${item.voters.length != 1 ? 's' : ''}`
				}
			]
		},
    {
      "type": "divider"
    }
  ]
}

export function getVoteButton(voted: boolean): Button {
  return {
    "type": "button",
    "text": {
      "type": "plain_text",
      "emoji": true,
      "text": voted ? "✅ You Voted" : "🗳️ Vote"
    },
    "style": voted ? "primary" : undefined,
    "action_id": "vote_wishlist_item",
    "value": `${voted}`
  }
}