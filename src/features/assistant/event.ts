import {
  AnyMessageBlock,
  AnyTextField,
  ChatPostMessageResponse,
  MessageAttachment,
} from "slack-edge";
import { slack } from "../../slack";
import { promptAssistant } from "./prompt";

/**
 * Handle the app_mention event by prompting chatgpt to respond to the users message.
 *
 * The event fires each time a user mentions the slack app in a message.
 * The handler will prompt chatgpt with the users message and post its response as a new message in the same channel.
 */
slack.event("app_mention", async (request) => {
  const event = request.payload;

  const message = event.text;

  let n = 0;
  const msg = await createLoadingMessage(event.channel);

  const interval = setInterval(() => {
    n = (n + 1) % 3;
    updateLoadingMessage(msg, n);
  }, 1000);

  const results = await promptAssistant(message);
  let blocks: AnyMessageBlock[] = [
    {
      type: "section",
      text: {
        type: "plain_text",
        text: results.text,
      },
    },
  ];

  // TODO: Find better metric for unsuccessful responses.
  const knowsAnswer = !(results.text as string).includes("I don't know");

  if (knowsAnswer && results.sourceDocuments != null) {
    const sourceIds: string[] = [];
    const elements: AnyTextField[] = [];

    for (var doc of results.sourceDocuments) {
      const meta = doc.metadata;

      if (meta.notionId != null) {
        if (sourceIds.includes(meta.notionId)) continue;

        const props = meta.properties;
        const icon = meta.icon;

        const title = `${icon != null ? icon.emoji + " " : ""}${
          props?._title ?? props.title
        }`;
        const url = `https://www.notion.so/${meta.notionId.replaceAll(
          "-",
          ""
        )}`;

        sourceIds.push(meta.notionId);
        elements.push({
          type: "mrkdwn",
          text: `<${url}|${title}>`,
        });
      } else if (meta.type == "slack.message") {
        if (sourceIds.includes(meta.message_ts)) continue;

        sourceIds.push(meta.message_ts);
        elements.push({
          type: "mrkdwn",
          text: `<${meta.link}|${meta.title}>`,
        });
      }
    }

    if (elements.length > 0) {
      elements.unshift({
        type: "plain_text",
        text: "Learn more:",
      });

      blocks.push({
        type: "context",
        elements: elements,
      });
    }
  }

  clearInterval(interval);

  await slack.client.chat.update({
    channel: msg.channel!,
    ts: msg.ts!,
    text: results.text,
    blocks: blocks,
  });
});

async function createLoadingMessage(
  channel: string
): Promise<ChatPostMessageResponse> {
  return slack.client.chat.postMessage({
    channel: channel,
    text: "...",
    blocks: [
      {
        type: "context",
        elements: [{ type: "plain_text", text: "." }],
      },
    ],
  });
}

async function updateLoadingMessage(msg: ChatPostMessageResponse, n: number) {
  return slack.client.chat.update({
    channel: msg.channel!,
    ts: msg.ts!,
    text: "...",
    blocks: [
      {
        type: "context",
        elements: [{ type: "plain_text", text: "...".substring(0, n + 1) }],
      },
    ],
  });
}
