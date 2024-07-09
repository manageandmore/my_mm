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

  // Send an ephemeral message with an interactive button
  await slack.client.chat.postEphemeral({
    channel: payload.channel,
    user: payload.user,
    text: "Would you like to add this message to the 📬 Inbox of all users in this channel?", // Fallback text for notifications
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Would you like to add this message to the 📬 Inbox of all users in this channel?",
        },
      },
      {
        type: "context",
        elements: [{
          type: "mrkdwn",
          text: "By adding a message to a users Inbox it is easier for them to keep track and respond to that message without it getting lost. Additionally you can see easily who already responded to a message. When setting a deadline users will also get automatic reminders until they respond.",
        }, {
          type: "mrkdwn",
          text: "Press the button below to start creating a new inbox message.",
        }],
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
              channelId: payload.channel,
              messageTs: payload.ts,
            }),
            action_id: newMessageAction,
          },
        ],
      },
    ],
  });
});
