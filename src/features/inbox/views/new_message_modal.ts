import { ModalView, PlainTextOption } from "slack-edge";
import { newMessageAction } from "../events/create_new_message";
import {
  InboxAction,
  allResponseActions,
  defaultResponseActions,
} from "../data";

/**
 * Construct the new message modal
 *
 * @returns The new message modal view.
 */
export async function getNewMessageModal(
  channelId: string,
  messageTs: string,
  description: string,
  updateUrl: string
): Promise<ModalView> {
  return {
    type: "modal",
    callback_id: newMessageAction,
    title: {
      type: "plain_text",
      text: "New Inbox Message",
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
    private_metadata: JSON.stringify({
      channelId,
      messageTs,
      updateUrl,
    }),
    blocks: [
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "Write a short subject text for this inbox message including things like a summary, who it is relevant for and how they should respond. Additionally recipients will always see the original message.",
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
          text: "Message Subject",
          emoji: true,
        },
        element: {
          type: "plain_text_input",
          action_id: "message_description_input",
          multiline: true,
          max_length: 200,
          initial_value: description,
        },
      },
      {
        type: "input",
        block_id: "options",
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
              value: "enable_reminders",
              text: {
                type: "plain_text",
                text: "Enable reminders (Requires Deadline)",
                emoji: true,
              },
              description: {
                type: "plain_text",
                text: "Reminders will be sent 1 and 8 hours before, as well as 1, 3, 7 and 14 days before the deadline.",
                emoji: true,
              },
            },
            {
              value: "notify_on_create",
              text: {
                type: "plain_text",
                text: "Notify recipients on create",
                emoji: true,
              },
            },
          ],
        },
        optional: true,
      },
      {
        type: "input",
        block_id: "deadline",
        label: {
          type: "plain_text",
          text: "Deadline",
          emoji: true,
        },
        element: {
          type: "datetimepicker",
          action_id: "deadline_input_action",
        },
        optional: true,
      },
      {
        type: "input",
        block_id: "multi_select_menu",
        label: {
          type: "plain_text",
          text: "Response actions",
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
          options: allResponseActions.map(getOptionForAction),
          initial_options: defaultResponseActions.map(getOptionForAction),
        },
      },
    ],
  };
}

function getOptionForAction(action: InboxAction): PlainTextOption {
  return {
    text: {
      type: "plain_text",
      text: action.label,
      emoji: true,
    },
    value: JSON.stringify(action),
  };
}
