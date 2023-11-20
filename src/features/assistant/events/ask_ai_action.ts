import { Button } from "slack-edge";
import { slack } from "../../../slack";
import { assistantIndexDatabaseId } from "../data/load_pages";

const askAIAction = "ask_ai_action";

slack.action(askAIAction, async (request) => {
  await slack.client.views.open({
    trigger_id: request.payload.trigger_id,
    view: {
      type: "modal",
      title: {
        type: "plain_text",
        text: "🧠 Ask AI Assistant",
      },
      close: {
        type: "plain_text",
        text: "Got it",
      },
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text:
              "You can ask our AI assistant for any information regarding *Manage And More*. To use it, either\n" +
              "• *write a direct message* to this app (through the 'Messages' tab above)\n" +
              `• send a message in any channel and *tag <@${request.context.botUserId}> in the message*.`,
          },
        },
        {
          type: "divider",
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text:
                "The assistant is still in preview and has a limited knowledge about information from Notion and Slack.\n" +
                `• To add or remove a **notion page** to the ai index, check <https://www.notion.so/${assistantIndexDatabaseId}|this database>.\n` +
                '• To add or remove a **slack message** to the ai index, open the message context menu (tap "...") and select "Add to assistant". ' +
                "The assistant will react with a 🧠 emoji to every message it indexed.",
            },
          ],
        },
      ],
    },
  });
});

export function getAskAIButton(): Button {
  return {
    type: "button",
    text: {
      type: "plain_text",
      text: "🧠 Ask AI Assistant",
      emoji: true,
    },
    action_id: askAIAction,
  };
}
