import {
  AnyMessageBlock,
  AnyTextField,
  AppMentionEvent,
  ChatPostMessageResponse,
  GenericMessageEvent,
} from "slack-edge";
import { anyMessage, slack } from "../../../slack";
import { promptAssistant } from "../ai/prompt";
import { features } from "../../common/feature_flags";
import { assistantFeatureFlag } from "..";

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

  const results = await promptAssistant(message);

  //check if context was used by finding CNY in the response
  const usedContext = !(results.text as string).includes("CNY");
  //delete CNY from the response
  results.text = results.text.replace("CNY", "");
  let blocks: AnyMessageBlock[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: results.text,
      },
    },
  ];

  // TODO: Find better metric for unsuccessful responses.
  const knowsAnswer = !(results.text as string).includes("I don't know");

  if (knowsAnswer && results.sourceDocuments != null) {
    const sourceIds: string[] = [];
    const elements: AnyTextField[] = [];

    if (usedContext) {
      for (var doc of results.sourceDocuments) {
        const meta = doc.metadata;

        if (meta.notionId != null) {
          if (sourceIds.includes(meta.notionId)) continue;

          sourceIds.push(meta.notionId);
          elements.push({
            type: "mrkdwn",
            text: `<${meta.url}|${meta.title}>`,
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
        blocks.push({
          type: "context",
          elements: [
            {
              type: "plain_text",
              text: "Learn more:",
            },
            elements[0],
          ],
        });
      }
    } else {
      //add note that context wasn't helpful
      blocks.push({
        type: "context",
        elements: [
          {
            type: "plain_text",
            text: "I couldn't find any relevant context from MM slack or notion.",
          },
        ],
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
