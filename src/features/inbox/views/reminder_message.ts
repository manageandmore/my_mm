import { AnyMessageBlock, AnyTextField } from "slack-edge";
import { InboxAction, ReceivedInboxEntry } from "../data";
import { asReadableDuration } from "../../common/time_utils";
import { getButtonForInboxAction } from "./inbox_section";

export function getReminderMessage(
  entry: ReceivedInboxEntry,
  type: "new" | "reminder",
  showButtons: boolean,
  action?: InboxAction
): { text: string; blocks: AnyMessageBlock[] } {
  let title = type == "new" ? "New Inbox Message" : "Inbox Reminder";

  let deadlineHint: AnyMessageBlock[] = [];
  if (showButtons && entry.deadline != null) {
    let timeLeft = asReadableDuration(entry.deadline * 1000 - Date.now());

    deadlineHint = [
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `*You have ${timeLeft}${
              type == "new" ? "" : " left"
            } to respond to this message.*`,
          },
        ],
      },
    ];
  }

  return {
    text: `📬 *${title}*:\n${entry.description}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `📬 *${title}*`,
        },
      },
      ...deadlineHint,
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: entry.description,
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "View original message",
            emoji: true,
          },
          url: entry.message.url,
        },
      },
      ...(<AnyMessageBlock[]>(showButtons
        ? [
            {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: "_You can mark this message as resolved by clicking one of the buttons below. This will notify the message author and remove it from your inbox._",
                },
              ],
            },
            {
              type: "actions",
              elements: entry.actions.map((a) =>
                getButtonForInboxAction(a, entry)
              ),
            },
          ]
        : action != undefined
        ? [
            {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: `*You responded with [${action.label}] to this message.*`,
                },
              ],
            },
          ]
        : [])),
    ],
  };
}
