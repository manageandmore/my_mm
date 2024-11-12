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
                confirm: {
                  title: {
                    type: "plain_text",
                    text: "Are you sure?",
                  },
                  text: {
                    type: "mrkdwn",
                    text: `Are you sure you want to remove ${expired} expired messages?`,
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
                entry.recipientIds.length - 1
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
            ? `<!date^${entry.deadline}^{date_short} {time}|${new Date(
                entry.deadline * 1000
              ).toLocaleString("de-DE")} UTC>`
            : "No deadline"
        }`,
      },
    },
  ];

  if (entry.reminders && entry.reminders.length > 0) {
    const now = Date.now() / 1000;
    let nextReminder: number | null = null;
    for (let i = 0; i < entry.reminders.length; i++) {
      if (entry.reminders[i] < now) continue;
      nextReminder = entry.reminders[i];
      break;
    }

    if (nextReminder != null) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Next reminder:* <!date^${nextReminder}^{date_short} {time}|${new Date(
            nextReminder * 1000
          ).toLocaleString("de-DE")} UTC>`,
        },
      });
    }
  }

  const actionCounts: { [action: string]: number } = {};

  for (const resolution of Object.values(entry.resolutions)) {
    const id = resolution.action.action_id;
    actionCounts[id] = (actionCounts[id] ?? 0) + 1;
  }

  blocks = blocks.concat([
    {
      type: "divider",
    },
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
      fields:
        entry.actions.map<AnyTextField>((a) => {
          const respondents = Object.keys(entry.resolutions).filter(
            (userId) =>
              entry.resolutions[userId].action.action_id === a.action_id
          );

          const respondentList =
            respondents.length > 0
              ? respondents.map((userId) => `<@${userId}>`).join(",\n")
              : "";
          const nonRespondents = entry.recipientIds.filter(
            (id) => !respondents.includes(id)
          );
          return {
            type: "mrkdwn",
            text: `*${a.label}*:\n${respondentList},`,
          };
        }) +
        (nonRespondents.length > 0
          ? `\n\n*Not responded:*\n${nonRespondents
              .map((id) => `<@${id}>`)
              .join(",\n")}`
          : ""),
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
            text: "Back",
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
