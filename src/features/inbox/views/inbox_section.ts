import { AnyHomeTabBlock, AnyTextField, Button, HeaderBlock } from "slack-edge";
import { InboxAction, ReceivedInboxEntry } from "../data";
import { openOutboxAction } from "../events/open_outbox";
import { asReadableDuration } from "../../common/time_utils";
import { has } from "cheerio/lib/api/traversing";

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

  let tooManyEntriesSection: AnyHomeTabBlock[] = [];
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
  } else if (entries.length > 15) {
    tooManyEntriesSection = [
      {
        type: "divider",
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "⚠️ *You have more than 15 messages in your inbox. Please resolve some messages first and reload the home screen.*",
          },
        ],
      },
    ];
  }
  //Slicing entries to less than 15 so not more than 100 blocks are sent
  entries = entries.slice(0, 15);

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
    ...tooManyEntriesSection,
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
              text: "View original message",
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
    style: action.style,
    value: JSON.stringify({
      messageTs: entry.message.ts,
      senderId: entry.senderId,
      action: action,
    }),
  };
}
