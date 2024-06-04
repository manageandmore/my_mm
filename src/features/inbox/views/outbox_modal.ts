import { AnyModalBlock, ModalView, Button } from "slack-edge";
import { SentInboxEntry } from "../data";
import { viewSentMessageAction } from "../events/view_sent_message";

/**
 * Construct the outbox modal
 *
 * @param messages - The messages to construct the outbox modal.
 * @returns The outbox modal view.
 */
export function getOutboxModal(outbox: SentInboxEntry[]): ModalView {
  let blocks: AnyModalBlock[];
  if (outbox.length === 0) {
    blocks = [
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "You have not sent any messages yet.",
          },
        ],
      },
    ];
  } else {
    blocks = [
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "Here are the messages you have sent to others.",
          },
        ],
      },
      {
        type: "divider",
      },
    ];

    for (let entry of outbox) {
      blocks = blocks.concat(getOutboxItem(entry));
    }
  }

  return {
    type: "modal",
    title: {
      type: "plain_text",
      text: "Outbox",
    },
    blocks: blocks,
  };
}

function getOutboxItem(entry: SentInboxEntry): AnyModalBlock[] {
  return [
    {
      type: "section",
      block_id: entry.message.ts,
      text: {
        type: "mrkdwn",
        text: `*${entry.description}*`,
      },
      accessory: getViewMessageButton(entry),
    },
    {
      type: "divider",
    },
  ];
}

function getViewMessageButton(entry: SentInboxEntry): Button {
  return {
    type: "button",
    text: {
      type: "plain_text",
      text: "View Message",
    },
    action_id: viewSentMessageAction,
    value: JSON.stringify(entry),
  };
}
