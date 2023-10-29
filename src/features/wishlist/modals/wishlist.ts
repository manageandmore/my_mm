import { AnyModalBlock, Button, ImageElement, ModalView } from "slack-edge";
import { newWishlistItemAction } from "../actions/new_suggestion";
import { viewWishlistInNotionAction } from "../actions/open_wishlist";
import { voteWishlistItemAction } from "../actions/vote_suggestion";
import { wishlistDatabaseId, WishlistItem } from "../data/query_items";

/** Interface for the data used to hydrate the wishlist modal. */
export interface WishlistOptions {
  items?: WishlistItem[]
}

/**
 * Constructs the modal view for the wishlist.
 * 
 * @param options The options for hydrating the modal.
 * @returns The modal view.
 */
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
            "action_id": newWishlistItemAction,
          },
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "text": "View in Notion",
              "emoji": true
            },
            "url": `https://www.notion.so/${wishlistDatabaseId}`,
            "action_id": viewWishlistInNotionAction,
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

function getWishlistItem(item: WishlistItem): AnyModalBlock[] {
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
				},
        {
					"type": "plain_text",
					"emoji": true,
					"text": `∙`
				},
        {
					"type": "plain_text",
					"emoji": true,
					"text": `Created ${item.timeSinceCreated} ago`
				}
			]
		},
    {
      "type": "divider"
    }
  ]
}

function getVoteButton(voted: boolean): Button {
  return {
    "type": "button",
    "text": {
      "type": "plain_text",
      "emoji": true,
      "text": voted ? "✅ You Voted" : "🗳️ Vote"
    },
    "style": voted ? "primary" : undefined,
    "action_id": voteWishlistItemAction,
    "value": `${voted}`
  }
}