import { AnyHomeTabBlock, ModalView, PlainTextOption } from "slack-edge";
import {
  newMessageAction,
  addCalendarEntryAction,
} from "../events/create_new_message";
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
  updateUrl: string,
  calendarEventUrl?: string
): Promise<ModalView> {
  let calendarEntryBlock: AnyHomeTabBlock;
  console.log("calendarEventUrl", calendarEventUrl);
  if (calendarEventUrl) {
    calendarEntryBlock = {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Calendar Event URL:* <${calendarEventUrl}|Google calendar link>`,
      },
    };
  } else {
    calendarEntryBlock = {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "No Calendar Event URL provided. This google calendar link will be sent to respondents.",
      },
      accessory: {
        type: "button",
        text: {
          type: "plain_text",
          text: "Add Calendar URL",
          emoji: true,
        },
        action_id: addCalendarEntryAction,
        value: JSON.stringify({ channelId, messageTs, description, updateUrl }),
        //open calendar entry modal + transfer all arguments needed for new message modal which need to be passed through
      },
    };
  }

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
      calendarEventUrl,
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
        type: "section",
        text: {
          type: "mrkdwn",
          text: "See this doc for a short introduction on this feature: ",
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "Inbox & Outbox",
            emoji: true,
          },
          style: "primary",
          url: "https://www.notion.so/manageandmore/My-MM-Slack-App-10c02ddfbf4e80da95dac9b29543acfa?pvs=4#10e02ddfbf4e801bb6d3e406931587d2",
        }
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
      calendarEntryBlock,
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

/**
 * Construct the create calendar event modal
 *
 * @returns The create calendar event modal view.
 */
export async function getCreateCalendarEventModal(
  channelId: string,
  messageTs: string,
  description: string,
  updateUrl: string,
  view_id: string
): Promise<ModalView> {
  return {
    type: "modal",
    callback_id: addCalendarEntryAction,
    title: {
      type: "plain_text",
      text: "Create Calendar Event",
      emoji: false,
    },
    submit: {
      type: "plain_text",
      text: "Submit",
      emoji: true,
    },
    private_metadata: JSON.stringify({
      channelId,
      messageTs,
      description,
      updateUrl,
      view_id,
    }),
    close: {
      type: "plain_text",
      text: "Cancel",
    },
    blocks: [
      {
        type: "input",
        block_id: "event_name",
        label: {
          type: "plain_text",
          text: "Event Name",
          emoji: true,
        },
        element: {
          type: "plain_text_input",
          action_id: "event_name_input",
        },
      },
      {
        type: "input",
        block_id: "event_start_time",
        label: {
          type: "plain_text",
          text: "Event Start Time",
          emoji: true,
        },
        element: {
          type: "datetimepicker",
          action_id: "start_time_input",
        },
      },
      {
        type: "input",
        block_id: "event_end_time",
        label: {
          type: "plain_text",
          text: "Event End Time",
          emoji: true,
        },
        element: {
          type: "datetimepicker",
          action_id: "end_time_input",
        },
      },
    ],
  };
}
