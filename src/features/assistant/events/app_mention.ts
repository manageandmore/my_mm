import {
  AnyMessageBlock,
  AnyTextField,
  AppMentionEvent,
  GenericMessageEvent,
} from "slack-edge";
import { anyMessage, slack } from "../../../slack";
import { promptAssistant } from "../ai/chain";

/**
 * Handles text messages sent to the app by prompting chatgpt to respond to the users message.
 */
anyMessage(async (request) => {
  const payload = request.payload;

  // Guard for direct messages to the app.
  if (payload.channel_type != "im") {
    return;
  }

  // Guard for only generic text messages.
  if (payload.subtype != undefined) {
    return;
  }

  await triggerAssistant(payload, request.context.botUserId);
});

/**
 * Handle the app_mention event by prompting chatgpt to respond to the users message.
 *
 * The event fires each time a user mentions the Slack app in a message.
 * The handler will prompt chatgpt with the users message and post its response as a new message in the same channel.
 */
slack.event("app_mention", async (request) => {
  const payload = request.payload;
  if (payload.text.toLowerCase().includes("-ai")) {
    await triggerAssistant(payload, request.context.botUserId);
  }
});

/**
 * Shared message for triggering the assistant and generating a response.
 *
 * This is executed for both direct messages to the app and mentions of the app in channels.
 */
async function triggerAssistant(
  event: GenericMessageEvent | AppMentionEvent,
  botUserId: string | undefined
) {
  const message = event.text.replaceAll(`<@${botUserId}>`, "");

  // Display animating dots ('...') while the response is loading.
  const msg = await slack.client.chat.postMessage({
    channel: event.channel,
    thread_ts: event.thread_ts,
    text: "...",
    blocks: [
      {
        type: "context",
        elements: [{ type: "plain_text", text: "." }],
      },
    ],
  });

  let n = 0;
  const interval = setInterval(() => {
    n = (n + 1) % 3;
    slack.client.chat.update({
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
  }, 1000);

  const result = await promptAssistant(message);
  let blocks: AnyMessageBlock[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: result.response,
      },
    },
  ];

  // If given, add links to the relevant sources.
  if (result.learnMore.length > 0) {
    blocks.push({
      type: "context",
      elements: [
        {
          type: "plain_text",
          text: "Learn more:",
        },
        ...result.learnMore
          // Pick at max. 9 links (max context elements is 10)
          .slice(0, 9)
          .map<AnyTextField>((link) => ({ type: "mrkdwn", text: link })),
      ],
    });
  }

  clearInterval(interval);

  // Send the response.

  await slack.client.chat.update({
    channel: msg.channel!,
    ts: msg.ts!,
    text: result.response,
    blocks: blocks,
  });
}
