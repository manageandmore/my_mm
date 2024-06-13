import { AnyHomeTabBlock, Button, HeaderBlock } from "slack-edge";
import { InboxAction, ReceivedInboxEntry } from "../data";

/**
 * Constructs the inbox section.
 */
export function getInboxSection(
  entries: ReceivedInboxEntry[]
): AnyHomeTabBlock[] {
  const header: HeaderBlock = {
    type: "header",
    text: {
      type: "plain_text",
      text: (entries.length == 0 ? "📭" : "📬") + " Your Inbox",
    },
  };

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
    ...entries.flatMap<AnyHomeTabBlock>((e) => [
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
      {
        type: "actions",
        elements: e.actions.map<Button>((a) => getButtonForInboxAction(a, e)),
      },
    ]),
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
