import { indexedChannels } from "../../../constants";
import { anyMessage, getPublicChannels, slack } from "../../../slack";
import { newMessageAction } from "./create_new_message";

/**
 * Listens to new messages and posts an ephemeral message to the user to add the message to the inbox.
 */
anyMessage(async (request) => {
  const payload = request.payload;

  if (payload.subtype === "bot_message") {
    return;
  }

  if (payload.text.includes(`<@${request.context.botUserId}>`)) {
    return;
  }

  const channels = await getPublicChannels();
  const channelName = channels.get(payload.channel)?.name;

  if (channelName == null) {
    return;
  }
  const isIndexed = indexedChannels.includes(channelName);
  if (!isIndexed) {
    return;
  }
  await responseEmphemeral(payload.channel, payload.user, payload.ts);
});

async function responseEmphemeral(channel: string, user: string, ts: string) {
  // Send an ephemeral message with an interactive button
  await slack.client.chat.postEphemeral({
    channel: channel,
    user: user,
    text: "📬 Would you like to add this message to the *Inbox* of all users in this channel?", // Fallback text for notifications
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "📬 Would you like to add this message to the *Inbox* of all users in this channel?",
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "By adding a message to a users inbox it is easier for them to keep track and respond to that message without it getting lost.",
          },
          {
            type: "mrkdwn",
            text: "Additionally you can see easily who already responded to a message.",
          },
          {
            type: "mrkdwn",
            text: "When setting a deadline users will also get automatic reminders until they respond.",
          },
          {
            type: "mrkdwn",
            text: "Press the button below to start creating a new inbox message.",
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
              text: "Add to Inbox",
              emoji: true,
            },
            value: JSON.stringify({
              channelId: channel,
              messageTs: ts,
            }),
            action_id: newMessageAction,
          },
        ],
      },
    ],
  });
}

/**
 * Handle the app_mention event by prompting chatgpt to respond to the users message.
 *
 * The event fires each time a user mentions the slack app in a message.
 * The handler will prompt chatgpt with the users message and post its response as a new message in the same channel.
 */

slack.event("app_mention", async (request) => {
  const payload = request.payload;
  console.log("app_mention", payload);

  // Guard for inbox add
  if (payload.text.toLowerCase().includes("-add to inbox")) {
    console.log("add to inbox");
    if (payload.blocks) {
      for (const blockType of payload.blocks) {
        if (blockType.type !== "rich_text") {
          console.log("block type not rich text");
          return;
        }
      }
      // Check that message has user
      if (payload.user) {
        await responseEmphemeral(payload.channel, payload.user, payload.ts);
      }
    }
  }
});
