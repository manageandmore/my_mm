import { AnyModalBlock, ModalView, AnyTextField } from "slack-edge";
import { SentInboxEntry } from "../data";
import {
  deleteSentMessageAction,
  viewSentMessageAction,
} from "../events/view_sent_message";
import {
  deleteExpiredOutboxMessagesAction,
  openOutboxAction,
} from "../events/open_outbox";

/**
 * Construct the outbox modal
 *
 * @param messages - The messages to construct the outbox modal.
 * @returns The outbox modal view.
 */
export function getOutboxModal(
  outbox: SentInboxEntry[],
  expired: number
): ModalView {
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
      ...(<AnyModalBlock[]>(expired > 0
        ? [
            {
              type: "divider",
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `You have ${expired} expired outbox message${
                  expired > 1 ? "s" : ""
                }. Do you want to remove them from everyone's inbox?`,
              },
              accessory: {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Remove expired messages",
                },
                style: "danger",
                action_id: deleteExpiredOutboxMessagesAction,
              },
            },
          ]
        : [])),
      {
        type: "divider",
      },
      ...outbox.flatMap<AnyModalBlock>((entry) => [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*${entry.description}*`,
          },
          accessory: {
            type: "button",
            text: {
              type: "plain_text",
              text: "View Details",
            },
            action_id: viewSentMessageAction,
            value: JSON.stringify({
              messageTs: entry.message.ts,
            }),
          },
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `Sent to <#${entry.message.channel}>`,
            },
            {
              type: "mrkdwn",
              text: `<${entry.message.url}|Original message>`,
            },
            {
              type: "mrkdwn",
              text: `Responses: ${Object.keys(entry.resolutions).length} / ${
                entry.recipientIds.length
              }`,
            },
          ],
        },
        {
          type: "divider",
        },
      ]),
    ];
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

export async function getViewSentMessageModal(
  entry: SentInboxEntry
): Promise<ModalView> {
  let blocks: AnyModalBlock[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: entry.description,
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `Sent to <#${entry.message.channel}>`,
        },
        {
          type: "mrkdwn",
          text: `<${entry.message.url}|Original message>`,
        },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Deadline:* ${
          entry.deadline
            ? new Date(entry.deadline).toLocaleString()
            : "No deadline"
        }`,
      },
    },
  ];

  const actionCounts: { [action: string]: number } = {};

  for (const resolution of Object.values(entry.resolutions)) {
    const id = resolution.action.action_id;
    actionCounts[id] = (actionCounts[id] ?? 0) + 1;
  }

  blocks = blocks.concat([
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Responses*:  ${Object.keys(entry.resolutions).length} / ${
          entry.recipientIds.length
        }`,
      },
    },
    {
      type: "section",
      fields: entry.actions.map<AnyTextField>((a) => ({
        type: "mrkdwn",
        text: `*${a.label}*:  ${actionCounts[a.action_id] ?? 0}`,
      })),
    },
    {
      type: "divider",
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "View all",
          },
          action_id: openOutboxAction,
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Delete",
          },
          style: "danger",
          action_id: deleteSentMessageAction,
          value: JSON.stringify({
            messageTs: entry.message.ts,
          }),
          confirm: {
            title: {
              type: "plain_text",
              text: "Are you sure?",
            },
            text: {
              type: "mrkdwn",
              text: "Are you sure you want to delete this inbox message?",
            },
            confirm: {
              type: "plain_text",
              text: "Yes",
            },
            deny: {
              type: "plain_text",
              text: "No",
            },
          },
        },
      ],
    },
  ]);

  return {
    type: "modal",
    title: {
      type: "plain_text",
      text: "Outbox Message",
    },
    blocks: blocks,
  };
}
