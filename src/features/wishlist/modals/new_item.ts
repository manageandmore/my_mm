import { ModalView } from "slack-edge"

export function getNewItemModal(): ModalView {
  return {
    "type": "modal",
    "callback_id": "new_wishlist_item",
    "title": {
      "type": "plain_text",
      "text": "🎁 New Suggestion",
      "emoji": true
    },
    "submit": {
      "type": "plain_text",
      "text": "Submit",
      "emoji": true
    },
    "close": {
      "type": "plain_text",
      "text": "Cancel",
    },    
    "blocks": [
      {
        "type": "context",
        "elements": [
          {
            "type": "mrkdwn",
            "text": "Add a new suggestion for *My MM*. Try to be concise and specific, so others can vote on your idea."
          }
        ]
      },
      {
        "type": "divider"
      },
      {
        "type": "input",
        "block_id": "title",
        "label": {
          "type": "plain_text",
          "text": "Title",
          "emoji": true
        },
        "element": {
          "type": "plain_text_input",
          "action_id": "title",
          "multiline": false,
          "min_length": 10,
          "max_length": 100,
          "focus_on_load": true
        }
      },
      {
        "type": "input",
        "block_id": "description",
        "label": {
          "type": "plain_text",
          "text": "Description",
          "emoji": true
        },
        "element": {
          "type": "plain_text_input",
          "action_id": "description",
          "multiline": true,
          "min_length": 20,
          "max_length": 200
        }
      },
    ],
  }
}