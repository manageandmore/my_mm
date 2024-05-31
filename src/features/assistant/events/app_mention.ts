import {
  AnyMessageBlock,
  AnyTextField,
  AppMentionEvent,
  ChatPostMessageResponse,
  GenericMessageEvent,
} from "slack-edge";
import { anyMessage, slack } from "../../../slack";
import { features } from "../../common/feature_flags";
import { assistantFeatureFlag } from "..";
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
 * The event fires each time a user mentions the slack app in a message.
 * The handler will prompt chatgpt with the users message and post its response as a new message in the same channel.
 */
slack.event("app_mention", async (request) => {
  const payload = request.payload;

  await triggerAssistant(payload, request.context.botUserId);
});

async function triggerAssistant(
  event: GenericMessageEvent | AppMentionEvent,
  botUserId: string | undefined
) {
  const isEnabled = await features.check(assistantFeatureFlag, event.user!);
  if (!isEnabled) {
    let message = features.read(assistantFeatureFlag).tags.DisabledHint;
    if (message) {
      await sendDisabledMessage(event.channel, event.user!, message);
    }
    return;
  }

  const message = event.text.replaceAll(`<@${botUserId}>`, "");

  let n = 0;
  const msg = await createLoadingMessage(event.channel);

  const interval = setInterval(() => {
    n = (n + 1) % 3;
    updateLoadingMessage(msg, n);
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


  if (result.learnMore.length > 0) {
    blocks.push({
      type: "context",
      elements: [
        {
          type: "plain_text",
          text: "Learn more:",
        },
        // Pick at max. 9 links (max context elements is 10)
        ...result.learnMore
          .slice(0, 9)
          .map<AnyTextField>((link) => ({ type: "mrkdwn", text: link })),
      ],
    });
  }

  clearInterval(interval);

  await slack.client.chat.update({
    channel: msg.channel!,
    ts: msg.ts!,
    text: result.response,
    blocks: blocks,
  });
}

async function sendDisabledMessage(
  channel: string,
  userId: string,
  message: string
) {
  await slack.client.chat.postEphemeral({
    channel: channel,
    user: userId,
    text: message,
  });
}

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
