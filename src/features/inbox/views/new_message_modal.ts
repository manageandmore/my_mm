import { ModalView, PlainTextOption } from "slack-edge";
import { newMessageAction } from "../events/create_new_message";
import { responseActions } from "../data";

/**
 * Construct the new message modal
 *
 * @returns The new message modal view.
 */
export function getNewMessageModal(): ModalView {
  const options = getResponseActionsOptions();
  return {
    type: "modal",
    callback_id: newMessageAction,
    title: {
      type: "plain_text",
      text: "New Message",
      emoji: false,
    },
    submit: {
      type: "plain_text",
      text: "Submit",
      emoji: true,
    },
    close: {
      type: "plain_text",
      text: "Cancel",
    },
    blocks: [
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "Send a new message to someone.",
          },
        ],
      },
      {
        type: "divider",
      },
      {
        type: "input",
        block_id: "message_description",
        label: {
          type: "plain_text",
          text: "Message",
          emoji: true,
        },
        element: {
          type: "plain_text_input",
          action_id: "message_description_input",
          multiline: true,
          min_length: 4,
          max_length: 100,
        },
      },
      {
        type: "input",
        block_id: "message_date",
        label: {
          type: "plain_text",
          text: "Date",
          emoji: true,
        },
        element: {
          type: "datetimepicker",
          action_id: "message_date_picker",
          initial_date_time: Math.floor(Date.now() / 1000),
        },
      },
      {
        type: "input",
        block_id: "Options",
        label: {
          type: "plain_text",
          text: "Options",
          emoji: true,
        },
        element: {
          type: "checkboxes",
          action_id: "options_input_action",
          options: [
            {
              value: "No reminders",
              text: {
                type: "plain_text",
                text: "No reminders needed",
                emoji: true,
              },
            },
            {
              value: "notify_on_create",
              text: {
                type: "plain_text",
                text: "Notify recipients on create?",
                emoji: true,
              },
            },
            {
              value: "enable_reminders",
              text: {
                type: "plain_text",
                text: "Enable reminders?",
                emoji: true,
              },
              description: {
                type: "plain_text",
                text: "Reminders will be sent 1, 8 hours before aswell as 1, 3, 7, 14 days before the deadline if applicable.",
                emoji: true,
              },
            },
          ],
        },
      },
      {
        type: "input",
        block_id: "multi_select_menu",
        label: {
          type: "plain_text",
          text: "Response actions menu",
          emoji: true,
        },
        element: {
          type: "multi_static_select",
          action_id: "multi_select_menu_action",
          placeholder: {
            type: "plain_text",
            text: "Select items",
            emoji: true,
          },
          options: options,
        },
      },
    ],
  };
}

function getResponseActionsOptions(): PlainTextOption[] {
  const options: PlainTextOption[] = [];
  for (const action of responseActions) {
    options.push({
      text: {
        type: "plain_text",
        text: action.label,
        emoji: true,
      },
      value: JSON.stringify(action),
    });
  }
  return options;
}
