import { AnyHomeTabBlock, AnyTextField, Button, HeaderBlock } from "slack-edge";
import { InboxAction, ReceivedInboxEntry } from "../data";
import { openOutboxAction } from "../events/open_outbox";
import { asReadableDuration } from "../../common/time_utils";

/**
 * Constructs the inbox section.
 */
export function getInboxSection(
  entries: ReceivedInboxEntry[],
  hasOutbox: boolean
): AnyHomeTabBlock[] {
  const header: HeaderBlock = {
    type: "header",
    text: {
      type: "plain_text",
      text: (entries.length == 0 ? "📪" : "📬") + " Your Inbox",
    },
  };

  const outboxSection: AnyHomeTabBlock[] = hasOutbox
    ? [
        {
          type: "divider",
        },
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "📤 Your Outbox",
          },
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "The Outbox shows all messages you sent to others and how they responded.",
            },
          ],
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Open Outbox",
                emoji: true,
              },
              action_id: openOutboxAction,
            },
          ],
        },
      ]
    : [];

  if (entries.length == 0) {
    return [
      header,
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "All done. Check back later.",
          },
        ],
      },
      ...outboxSection,
    ];
  }

  return [
    header,
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "_You can mark messages as resolved by clicking one of its buttons. This will notify the message author and remove it from your inbox._",
        },
      ],
    },
    ...entries.flatMap<AnyHomeTabBlock>((e) => {
      let deadlineHint: AnyHomeTabBlock[] = [];
      if (e.deadline != null) {
        let timeLeft = asReadableDuration(
          new Date(e.deadline!).valueOf() - Date.now()
        );

        deadlineHint = [
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `*You have ${timeLeft} left to respond to this message.*`,
              },
            ],
          },
        ];
      }

      return [
        {
          type: "divider",
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: e.description,
          },
          accessory: {
            type: "button",
            text: {
              type: "plain_text",
              text: "Go to message",
              emoji: true,
            },
            url: e.message.url,
          },
        },
        ...deadlineHint,
        {
          type: "actions",
          elements: e.actions.map<Button>((a) => getButtonForInboxAction(a, e)),
        },
      ];
    }),
    ...outboxSection,
  ];
}

export function getButtonForInboxAction(
  action: InboxAction,
  entry: ReceivedInboxEntry
): Button {
  return {
    type: "button",
    text: {
      emoji: true,
      type: "plain_text",
      text: action.label,
    },
    action_id: action.action_id,
    value: JSON.stringify({
      messageTs: entry.message.ts,
      senderId: entry.senderId,
      action: action,
    }),
  };
}
