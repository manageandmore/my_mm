import { ModalView } from "slack-edge";

export interface EventModalOptions {
  
}

export function getEventModal(options: EventModalOptions): ModalView {
  return {
    "type": "modal",
    callback_id: "event-modal",
    "submit": {
      "type": "plain_text",
      "text": "Submit",
      "emoji": true
    },
    "close": {
      "type": "plain_text",
      "text": "Cancel",
      "emoji": true
    },
    "title": {
      "type": "plain_text",
      "text": "Create a new event",
      "emoji": true
    },
    "blocks": [
      {
        "type": "input",
        "label": {
          "type": "plain_text",
          "text": "Event type",
          "emoji": true
        },
        "element": {
          "type": "multi_static_select",
          "placeholder": {
            "type": "plain_text",
            "text": "Select the event type",
            "emoji": true
          },
          "options": [
            {
              "text": {
                "type": "plain_text",
                "text": "Meet and Mingle",
                "emoji": true
              },
              "value": "value-0"
            },
            {
              "text": {
                "type": "plain_text",
                "text": "Community Event",
                "emoji": true
              },
              "value": "value-1"
            },
            {
              "text": {
                "type": "plain_text",
                "text": "Meeting",
                "emoji": true
              },
              "value": "value-2"
            }
          ]
        }
      },
      {
        "type": "input",
        "label": {
          "type": "plain_text",
          "text": "Name",
          "emoji": true
        },
        "element": {
          "type": "plain_text_input"
        }
      },
      {
        "type": "input",
        "label": {
          "type": "plain_text",
          "text": "Description",
          "emoji": true
        },
        "element": {
          "type": "plain_text_input",
          "multiline": true
        },
        "optional": true
      }
    ]
  }
}